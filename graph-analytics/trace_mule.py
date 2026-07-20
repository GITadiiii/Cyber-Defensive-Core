"""
trace_mule.py
Multi-hop mule chain detection using Cypher path queries against the
IBM AML graph (real labeled laundering data).

PERFORMANCE NOTE: An unconstrained variable-length path match
(MATCH (a)-[:TRANSFERRED*3..6]->(b)) over the whole graph causes a
combinatorial explosion and can exceed AuraDB Free's memory limit. To avoid
this, we FIRST find the small set of accounts that appear in at least one
laundering-tagged transaction, and only search for paths STARTING from
those accounts (a much smaller, bounded search space) rather than searching
the entire graph.
"""

import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

from normalizer import normalize_lvi

load_dotenv()

URI = os.getenv("NEO4J_URI")
USERNAME = os.getenv("NEO4J_USERNAME")
PASSWORD = os.getenv("NEO4J_PASSWORD")

MAX_HOPS = 4  # kept modest to stay within free-tier memory limits
TIME_WINDOW_HOURS = 72
MAX_STARTING_ACCOUNTS = 200  # how many laundering-linked accounts to search from


def get_laundering_linked_accounts(session, limit=MAX_STARTING_ACCOUNTS):
    """Finds accounts that originate at least one laundering-tagged transaction."""
    query = """
    MATCH (a:Account)-[t:TRANSFERRED]->()
    WHERE t.is_laundering = true
    RETURN DISTINCT a.account_number AS account_number
    LIMIT $limit
    """
    result = session.run(query, limit=limit)
    return [record["account_number"] for record in result]


def find_mule_chains_from_account(session, account_number: str, limit_per_account=5):
    """
    Searches for 2-4 hop chains starting from a SPECIFIC account, bounded to
    a small candidate set, so the query stays cheap.
    """
    query = """
    MATCH (origin:Account {account_number: $account_number})
    MATCH path = (origin)-[t:TRANSFERRED*2..4]->(dest:Account)
    WHERE ANY(r IN relationships(path) WHERE r.is_laundering = true)
    WITH path, origin, dest,
         [n IN nodes(path) | n.account_number] AS chain_accounts,
         reduce(total = 0.0, r IN relationships(path) | total + r.amount) AS total_amount_inr,
         size(relationships(path)) AS hop_count,
         size([r IN relationships(path) WHERE r.is_laundering = true]) AS laundering_hop_count
    RETURN origin.account_number AS origin_account,
           dest.account_number AS destination_account,
           chain_accounts, hop_count, laundering_hop_count, total_amount_inr
    ORDER BY laundering_hop_count DESC, hop_count DESC
    LIMIT $limit
    """
    result = session.run(query, account_number=account_number, limit=limit_per_account)

    chains = []
    for record in result:
        hop_count = record["hop_count"]
        tx_per_minute = hop_count / (TIME_WINDOW_HOURS * 60.0)
        lvi = tx_per_minute * hop_count
        network_velocity_score = normalize_lvi(lvi)

        chains.append({
            "origin_account": record["origin_account"],
            "destination_account": record["destination_account"],
            "chain_accounts": record["chain_accounts"],
            "hop_count": hop_count,
            "laundering_hop_count": record["laundering_hop_count"],
            "total_amount_inr": round(record["total_amount_inr"], 2),
            "network_velocity_score": round(network_velocity_score, 2),
        })
    return chains


def run_demo(max_accounts_to_check=20, max_results=10):
    driver = GraphDatabase.driver(URI, auth=(USERNAME, PASSWORD))
    try:
        with driver.session() as session:
            print("Step 1: Finding accounts linked to laundering transactions...")
            accounts = get_laundering_linked_accounts(session)
            print(f"Found {len(accounts)} candidate accounts to search from.\n")

            print(f"Step 2: Searching for 2-{MAX_HOPS} hop chains "
                  f"from up to {max_accounts_to_check} of these accounts...\n")

            all_chains = []
            for account in accounts[:max_accounts_to_check]:
                chains = find_mule_chains_from_account(session, account)
                all_chains.extend(chains)
                if len(all_chains) >= max_results:
                    break

            if not all_chains:
                print("No multi-hop chains found from the checked accounts.")
                print("(Try increasing max_accounts_to_check, or MAX_HOPS.)")
            else:
                print(f"Found {len(all_chains)} mule chain(s):\n")
                for i, chain in enumerate(all_chains[:max_results], 1):
                    print(f"Chain #{i}:")
                    print(f"  Path: {' -> '.join(chain['chain_accounts'])}")
                    print(f"  Hops: {chain['hop_count']} "
                          f"(of which {chain['laundering_hop_count']} flagged laundering)")
                    print(f"  Total amount moved: Rs. {chain['total_amount_inr']:,}")
                    print(f"  NetworkVelocityScore: {chain['network_velocity_score']}")
                    print()

    except Exception as e:
        print(f"❌ Query failed: {e}")
    finally:
        driver.close()


if __name__ == "__main__":
    run_demo()