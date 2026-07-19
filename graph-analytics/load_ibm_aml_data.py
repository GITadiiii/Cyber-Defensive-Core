"""
load_ibm_aml_data.py
Loads the IBM Anti-Money-Laundering (HI-Small) dataset into Neo4j.

Unlike PaySim, this dataset is purpose-built to contain real multi-hop
laundering chains (fan-in, fan-out, stack, cycle, scatter-gather, etc.),
each transaction tagged with an 'Is Laundering' flag.

CSV columns (HI-Small_Trans.csv):
    Timestamp, From Bank, Account, To Bank, Account.1,
    Amount Received, Receiving Currency, Amount Paid, Payment Currency,
    Payment Format, Is Laundering

Schema created in Neo4j:
    (:Account {account_number, bank})
        -[:TRANSFERRED {amount, currency, timestamp, is_laundering, payment_format}]->
    (:Account {account_number, bank})

Amounts are converted from USD to INR (fixed approximate rate) since this
is an India-focused platform.
"""

import os
from datetime import datetime

import pandas as pd
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()

URI = os.getenv("NEO4J_URI")
USERNAME = os.getenv("NEO4J_USERNAME")
PASSWORD = os.getenv("NEO4J_PASSWORD")

CSV_PATH = "data/HI-Small_Trans.csv"

USD_TO_INR = 96.29  # current approximate conversion rate (July 2026)

MAX_ROWS_TO_LOAD = 50_000
BATCH_SIZE = 1_000

# To keep the graph demo-able on AuraDB Free, we prioritize:
#   1) ALL laundering-tagged transactions (there aren't many, and they're
#      exactly what trace_mule.py needs to find)
#   2) A random sample of legitimate transactions as background "noise",
#      padded up to MAX_ROWS_TO_LOAD


def load_csv_subset():
    print(f"Reading {CSV_PATH} in chunks (this is a ~475MB file)...")

    laundering_rows = []
    legit_sample_rows = []
    legit_sample_frac = 0.01  # 1% of legit rows per chunk, enough padding

    for chunk in pd.read_csv(CSV_PATH, chunksize=200_000):
        laundering_chunk = chunk[chunk["Is Laundering"] == 1]
        laundering_rows.append(laundering_chunk)

        legit_chunk = chunk[chunk["Is Laundering"] == 0]
        if len(legit_chunk) > 0:
            legit_sample_rows.append(legit_chunk.sample(frac=legit_sample_frac, random_state=42))

    laundering_df = pd.concat(laundering_rows, ignore_index=True) if laundering_rows else pd.DataFrame()
    print(f"Found {len(laundering_df)} laundering-tagged transactions in the full file.")

    legit_df = pd.concat(legit_sample_rows, ignore_index=True) if legit_sample_rows else pd.DataFrame()

    remaining_budget = max(MAX_ROWS_TO_LOAD - len(laundering_df), 0)
    if len(legit_df) > remaining_budget:
        legit_df = legit_df.sample(n=remaining_budget, random_state=42)

    df = pd.concat([laundering_df, legit_df], ignore_index=True)
    print(f"Final dataset: {len(df)} rows "
          f"({len(laundering_df)} laundering + {len(legit_df)} legit background).")
    return df


def load_into_neo4j(df: pd.DataFrame):
    driver = GraphDatabase.driver(URI, auth=(USERNAME, PASSWORD))

    def create_batch(tx, batch):
        query = """
        UNWIND $rows AS row
        MERGE (orig:Account {account_number: row.from_account})
        ON CREATE SET orig.bank = row.from_bank
        MERGE (dest:Account {account_number: row.to_account})
        ON CREATE SET dest.bank = row.to_bank
        MERGE (orig)-[t:TRANSFERRED {
            amount: row.amount_inr,
            timestamp: row.timestamp
        }]->(dest)
        SET t.currency = 'INR',
            t.is_laundering = row.is_laundering,
            t.payment_format = row.payment_format
        """
        tx.run(query, rows=batch)

    try:
        with driver.session() as session:
            total = len(df)
            for start in range(0, total, BATCH_SIZE):
                batch_df = df.iloc[start:start + BATCH_SIZE]
                batch = []
                for _, row in batch_df.iterrows():
                    # Timestamp format in this dataset: "2022/08/09 05:14"
                    try:
                        ts = datetime.strptime(str(row["Timestamp"]), "%Y/%m/%d %H:%M")
                    except ValueError:
                        ts = datetime.now()

                    batch.append({
                        "from_account": str(row["Account"]),
                        "from_bank": str(row["From Bank"]),
                        "to_account": str(row["Account.1"]),
                        "to_bank": str(row["To Bank"]),
                        "amount_inr": round(float(row["Amount Paid"]) * USD_TO_INR, 2),
                        "timestamp": ts.isoformat(),
                        "is_laundering": bool(row["Is Laundering"]),
                        "payment_format": str(row["Payment Format"]),
                    })
                session.execute_write(create_batch, batch)
                print(f"  Loaded {min(start + BATCH_SIZE, total)}/{total} rows into Neo4j...")

        print("✅ IBM AML data loaded into Neo4j successfully (amounts converted to INR).")

    except Exception as e:
        print(f"❌ Neo4j load failed: {e}")
    finally:
        driver.close()


if __name__ == "__main__":
    df = load_csv_subset()
    load_into_neo4j(df)