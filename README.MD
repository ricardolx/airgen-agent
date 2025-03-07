## airgen agent

An AI agent which can generate assets

1. images
2. logos
3. icons

### Agent

####  Agent Tools

1. generate_asset
2. remove_background
3. convert_to_vector

The Agent decides to use which tool based on the asset description provided by the user

#### LLM Models

Suggested models 

- **gpt-4o-mini** - Agent 
- **dale-e-3** - image generator

### Api

#### Endpoints

- **/generateImage** - generate image asset

### Cloud Function Infrastructure

Built using serverless firebase cloud functions and cloud secrets

#### Secrets

- **OPENAI_API_KEY** - the openai api key