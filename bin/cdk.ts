#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { GithubCiCdStack } from "../lib/github-cicd-stack";
import { FrontendStack } from "../lib/frontend-stack";

// cdkによるアプリケーション定義
const app = new cdk.App();

// フロントエンドアプリケーションスタック
new FrontendStack(app, "FrontendStack");

// GitHub Actionsによるデプロイを許可するOICDプロバイダーのデプロイ
new GithubCiCdStack(app, "GithubCiCdStack");
