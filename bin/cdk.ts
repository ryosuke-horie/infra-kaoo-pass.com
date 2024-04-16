#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AdminFrontendStack } from "../lib/admin-frontend-stack";
import { FrontendStack } from "../lib/frontend-stack";
import { GithubCiCdStack } from "../lib/github-cicd-stack";

// cdkによるアプリケーション定義
const app = new cdk.App();
const env = { region: "ap-northeast-1", account: "905418074681" };

// フロントエンドアプリケーションスタック
new FrontendStack(app, "FrontendStack", { env });

// 管理サイトフロントスタック
new AdminFrontendStack(app, "AdminFrontendStack", { env });

// GitHub Actionsによるデプロイを許可するOICDプロバイダーのデプロイ
new GithubCiCdStack(app, "GithubCiCdStack", { env });
