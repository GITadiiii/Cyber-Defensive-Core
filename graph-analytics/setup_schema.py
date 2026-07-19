"""
setup_schema.py
Sets up the Neo4j graph schema: uniqueness constraints on Account and Device nodes.
Run this once before loading any data.
"""

import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()

URI = os.getenv("NEO4J_URI")
USERNAME = os.getenv("NEO4J_USERNAME")
PASSWORD = os.getenv("NEO4J_PASSWORD")

SCHEMA_QUERIES = [
    "CREATE CONSTRAINT account_number_unique IF NOT EXISTS FOR (a:Account) REQUIRE a.account_number IS UNIQUE",
    "CREATE CONSTRAINT device_uid_unique IF NOT EXISTS FOR (d:Device) REQUIRE d.device_uid IS UNIQUE",
]


def setup_schema():
    driver = GraphDatabase.driver(URI, auth=(USERNAME, PASSWORD))
    try:
        with driver.session() as session:
            for query in SCHEMA_QUERIES:
                print(f"Running: {query}")
                session.run(query)
        print("✅ Schema constraints created successfully.")

        # Verify constraints exist
        with driver.session() as session:
            result = session.run("SHOW CONSTRAINTS")
            print("\nCurrent constraints:")
            for record in result:
                print(f"  - {record['name']}: {record['labelsOrTypes']} / {record['properties']}")

    except Exception as e:
        print(f"❌ Schema setup failed: {e}")
    finally:
        driver.close()


if __name__ == "__main__":
    setup_schema()