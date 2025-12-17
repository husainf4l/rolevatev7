const { S3Client, PutObjectCommand, ListBucketsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

async function testS3() {
  console.log('🔍 Testing S3 Configuration...\n');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('AWS_REGION:', process.env.AWS_REGION);
  console.log('AWS_BUCKET_NAME:', process.env.AWS_BUCKET_NAME);
  console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing');
  console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing');
  console.log('');

  if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_BUCKET_NAME) {
    console.error('❌ Missing AWS configuration');
    return;
  }

  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    // Skip listing buckets (user has explicit deny for s3:ListAllMyBuckets)
    // Go directly to upload test
    console.log('Test 1: Uploading test file to bucket:', process.env.AWS_BUCKET_NAME);
    const testContent = Buffer.from('Test file content - ' + new Date().toISOString());
    const putCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: 'test/test-file-' + Date.now() + '.txt',
      Body: testContent,
      ContentType: 'text/plain',
    });
    
    await s3Client.send(putCommand);
    const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/test/test-file-${Date.now()}.txt`;
    console.log('✅ Successfully uploaded test file to S3');
    console.log('S3 URL:', s3Url);
    console.log('');

    console.log('🎉 All S3 tests passed!');
  } catch (error) {
    console.error('❌ S3 Test Failed:', error.message);
    if (error.Code) console.error('Error Code:', error.Code);
    if (error.$metadata) {
      console.error('HTTP Status:', error.$metadata.httpStatusCode);
      console.error('Request ID:', error.$metadata.requestId);
    }
    console.error('\nFull error:', error);
  }
}

testS3();
