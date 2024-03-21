#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
// import { CdkTestStack } from '../lib/cdk_test-stack';
import { FrontendStack } from "../lib/frontend-stack";
import { GithubCiCdStack } from "../lib/github-cicd-stack";
import { AwsSolutionsChecks } from 'cdk-nag'
import { Aspects } from 'aws-cdk-lib';

const app = new cdk.App();
// cdk-nag AwsSolutions Packを追加し、追加のログを有効化
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))
const env = { region: "ap-northeast-1", account: "905418074681" };

new FrontendStack(app, "FrontendStack", { env });
new GithubCiCdStack(app, "GithubCiCdStack", { env });
