import { defineFunction } from '@aws-amplify/backend';

export const sunsetAnalyzer = defineFunction({
    name: 'sunset-analyzer',
    entry: './handler.ts',
    resourceGroupName: 'data', 
});