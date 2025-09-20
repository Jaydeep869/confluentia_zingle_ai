// /src/tests/test-llm.ts
const { generateSQLFromQuestion, validateSQL, explainSQL } = require('../lib/llm');

// Mock schema data for testing
const mockSchema = [
  { table_name: 'users', column_name: 'id', data_type: 'integer', is_nullable: 'NO' },
  { table_name: 'users', column_name: 'name', data_type: 'text', is_nullable: 'YES' },
  { table_name: 'users', column_name: 'email', data_type: 'text', is_nullable: 'YES' },
  { table_name: 'users', column_name: 'created_at', data_type: 'timestamp', is_nullable: 'YES' },
  { table_name: 'orders', column_name: 'id', data_type: 'integer', is_nullable: 'NO' },
  { table_name: 'orders', column_name: 'user_id', data_type: 'integer', is_nullable: 'YES' },
  { table_name: 'orders', column_name: 'amount', data_type: 'numeric', is_nullable: 'YES' },
  { table_name: 'orders', column_name: 'status', data_type: 'text', is_nullable: 'YES' },
];

async function testLLM() {
  console.log('Testing LLM integration...');
  
  // Test SQL generation
  try {
    const question = "Show me all users who have placed orders with amount greater than 100";
    const result = await generateSQLFromQuestion(question, mockSchema);
    
    console.log('Question:', question);
    console.log('Generated SQL:', result.sql);
    console.log('Explanation:', result.explanation);
    
    if (result.error) {
      console.error('Error:', result.error);
    } else {
      // Test SQL validation
      const validation = validateSQL(result.sql);
      console.log('SQL Validation:', validation.valid);
      if (!validation.valid) {
        console.error('Validation Error:', validation.error);
      }
      
      // Test SQL explanation
      const explanation = await explainSQL(result.sql);
      console.log('SQL Explanation:', explanation);
    }
  } catch (error) {
    console.error('Error testing LLM:', error);
  }
}

testLLM();