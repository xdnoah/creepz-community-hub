# Migration Guidelines

## IMPORTANT: Equipment Persistence

**NEVER drop the following tables in future migrations:**
- `user_equipment` - Contains all player equipment
- `shop_inventory` - Contains player shop inventories
- `lizards` - Contains player lizard data
- `profiles` - Contains user profiles

## Best Practices

### Adding New Columns
✅ **DO THIS:**
```sql
ALTER TABLE user_equipment
  ADD COLUMN IF NOT EXISTS new_column_name TYPE DEFAULT value;
```

❌ **DON'T DO THIS:**
```sql
DROP TABLE user_equipment;
CREATE TABLE user_equipment (...);
```

### Modifying Existing Columns
✅ **DO THIS:**
```sql
ALTER TABLE user_equipment
  ALTER COLUMN column_name TYPE new_type USING column_name::new_type;
```

### Adding New Stats/Enum Values
✅ **DO THIS:**
```sql
ALTER TYPE equipment_stat_type ADD VALUE IF NOT EXISTS 'new_stat_name';
```

### Modifying Functions
✅ **DO THIS:**
```sql
CREATE OR REPLACE FUNCTION function_name(...)
RETURNS ... AS $$
...
$$ LANGUAGE plpgsql;
```

## Migration Checklist

Before pushing a new migration:
- [ ] Does it preserve existing user data?
- [ ] Does it use `ALTER TABLE` instead of `DROP TABLE`?
- [ ] Does it use `IF NOT EXISTS` / `IF EXISTS` clauses?
- [ ] Have you tested it on a copy of production data?
- [ ] Does it include appropriate indexes?
- [ ] Does it maintain RLS policies?

## Equipment Schema

The equipment system uses JSONB for stats to allow flexibility:

```json
{
  "stats": [
    {"type": "hp", "value": 100},
    {"type": "atk", "value": 50}
  ]
}
```

This allows items to have 1-4 stats based on rarity without schema changes.

## Testing Migrations

1. Create a local Supabase instance
2. Apply existing migrations
3. Add test data
4. Apply your new migration
5. Verify data persists and works correctly

## Rolling Back

If a migration causes issues:
1. Never use Supabase's automatic rollback - it may delete data
2. Write a new migration to fix the issue
3. Migrations are append-only in production
