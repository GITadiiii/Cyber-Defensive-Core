"""
test_connection.py
Quick script to verify the Neo4j AuraDB connection is working.
Reads credentials from .env file.
"""

import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()

URI = os.getenv("NEO4J_URI")
USERNAME = os.getenv("NEO4J_USERNAME")
PASSWORD = os.getenv("NEO4J_PASSWORD")

def test_connection():
    driver = GraphDatabase.driver(URI, auth=(USERNAME, PASSWORD))
    try:
        driver.verify_connectivity()
        print("✅ Successfully connected to Neo4j AuraDB!")

        with driver.session() as session:
            result = session.run("RETURN 'Hello from Neo4j' AS message")
            record = result.single()
            print(f"Test query result: {record['message']}")

    except Exception as e:
        print(f"❌ Connection failed: {e}")
    finally:
        driver.close()

if __name__ == "__main__":
    test_connection()