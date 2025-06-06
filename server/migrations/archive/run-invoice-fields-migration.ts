import runMigration from './add-invoice-reference-fields';

// Execute the migration
console.log('Starting invoice reference fields migration...');
runMigration()
  .then(() => {
    console.log('Invoice reference fields migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Invoice reference fields migration failed:', error);
    process.exit(1);
  }); 