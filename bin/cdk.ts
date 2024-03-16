#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { FrontendStack } from "../lib/frontend-stack";
import { GithubCiCdStack } from "../lib/github-cicd-stack";

// cdkによるアプリケーション定義
const app = new cdk.App();

// フロントエンドアプリケーションスタック
new FrontendStack(app, "FrontendStack");

// GitHub Actionsによるデプロイを許可するOICDプロバイダーのデプロイ
new GithubCiCdStack(app, "GithubCiCdStack");
