#!/usr/bin/env python3
"""
Database migration script for LangGraph PostgreSQL checkpointer
Creates necessary tables for interview session persistence
"""
import asyncio
import os
from dotenv import load_dotenv
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

load_dotenv()

async def migrate_database():
    """Run database migrations"""
    
    # Get PostgreSQL connection details
    postgres_url = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_HOST')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"
    
    print("=" * 80)
    print("🔧 LangGraph PostgreSQL Migration")
    print("=" * 80)
    print(f"📡 Database: {os.getenv('POSTGRES_DB')}")
    print(f"🌍 Host: {os.getenv('POSTGRES_HOST')}")
    print(f"👤 User: {os.getenv('POSTGRES_USER')}")
    print("=" * 80)
    
    try:
        print("\n📡 Connecting to PostgreSQL...")
        
        async with AsyncPostgresSaver.from_conn_string(postgres_url) as checkpointer:
            print("✅ Connected successfully!")
            
            print("\n🔧 Creating checkpoint tables...")
            await checkpointer.setup()
            
            print("✅ Checkpoint tables created successfully!")
            
            print("\n📊 Tables created:")
            print("   • checkpoints - Stores LangGraph state snapshots")
            print("   • checkpoint_writes - Stores checkpoint write operations")
            
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print("\n" + "=" * 80)
    print("✅ Migration completed successfully!")
    print("=" * 80)
    return True

if __name__ == "__main__":
    success = asyncio.run(migrate_database())
    exit(0 if success else 1)
