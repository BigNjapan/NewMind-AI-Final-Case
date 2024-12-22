const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200',
  maxRetries: 5,
  requestTimeout: 60000,
  sniffOnStart: true
});

const waitForElasticsearch = async () => {
  console.log('Waiting for Elasticsearch...');
  for (let i = 0; i < 30; i++) {
    try {
      await client.ping();
      console.log('Elasticsearch is ready');
      return;
    } catch (error) {
      console.log('Elasticsearch not ready, retrying in 1 second...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Elasticsearch did not become ready in time');
};

const initializeIndex = async () => {
  try {
    // Wait for Elasticsearch to be ready
    await waitForElasticsearch();

    // Check if index exists
    console.log('Checking if products index exists...');
    const { body: exists } = await client.indices.exists({
      index: 'products'
    });

    if (exists) {
      console.log('Deleting existing products index...');
      await client.indices.delete({
        index: 'products'
      });
    }

    // Create index with mappings
    console.log('Creating products index with mappings...');
    await client.indices.create({
      index: 'products',
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              custom_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'asciifolding']
              }
            }
          }
        },
        mappings: {
          properties: {
            name: { 
              type: 'text',
              analyzer: 'custom_analyzer',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256
                }
              }
            },
            description: { 
              type: 'text',
              analyzer: 'custom_analyzer'
            },
            category: { type: 'keyword' },
            price: { type: 'float' },
            stock: { type: 'integer' },
            image: { type: 'keyword' },
            createdAt: { type: 'date' }
          }
        }
      }
    });

    console.log('Products index created successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Elasticsearch index:', error);
    throw error;
  }
};

const bulkIndex = async (operations) => {
  try {
    console.log(`Bulk indexing ${operations.length / 2} products...`);
    const { body: bulkResponse } = await client.bulk({ 
      refresh: true,
      body: operations 
    });

    if (bulkResponse.errors) {
      const erroredDocuments = [];
      bulkResponse.items.forEach((action, i) => {
        const operation = Object.keys(action)[0];
        if (action[operation].error) {
          erroredDocuments.push({
            status: action[operation].status,
            error: action[operation].error,
            operation: operations[i * 2],
            document: operations[i * 2 + 1]
          });
        }
      });
      console.error('Bulk indexing errors:', erroredDocuments);
      throw new Error('Bulk indexing failed');
    }

    console.log('Bulk indexing completed successfully');
    return true;
  } catch (error) {
    console.error('Error bulk indexing:', error);
    throw error;
  }
};

module.exports = {
  client,
  waitForElasticsearch,
  initializeIndex,
  bulkIndex
}; 