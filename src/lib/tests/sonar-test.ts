import { analyzeWithMedia } from '../sonar-config';

async function testSonarReasoning() {
  try {
    console.log('Starting Perplexity Sonar Reasoning Pro test...');
    
    const testPrompt = 'Analyze viral potential of: A cat playing piano while wearing sunglasses';
    console.log('Test prompt:', testPrompt);
    
    const result = await analyzeWithMedia(testPrompt);
    
    console.log('\nSonar Reasoning Pro Test Result:');
    console.log('Response:', result.choices[0].message.content);
    console.log('\nAPI Response Details:');
    console.log('Model:', result.model);
    console.log('Usage:', result.usage);
    
    console.log('\nTest completed successfully! ✅');
    return true;
  } catch (error) {
    console.error('\nSonar Reasoning Pro Test Failed ❌');
    console.error('Error details:', error);
    return false;
  }
}

// Run the test
console.log('='.repeat(50));
console.log('Perplexity Sonar Reasoning Pro Integration Test');
console.log('='.repeat(50));

testSonarReasoning(); 