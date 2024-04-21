#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AccountFrontendStack } from "../lib/account-frontend-stack";
import { AdminFrontendStack } from "../lib/admin-frontend-stack";
import { GithubCiCdStack } from "../lib/github-cicd-stack";
import { MypageFrontendStack } from "../lib/mypage-frontend-stack";

// cdkによるアプリケーション定義
const app = new cdk.App();
const env = { region: "ap-northeast-1", account: "905418074681" };

// フロントエンドアプリケーションスタック
new AccountFrontendStack(app, "FrontendStack", { env });

// 管理サイトフロントスタック
new AdminFrontendStack(app, "AdminFrontendStack", { env });

// 会員マイページフロントスタック
new MypageFrontendStack(app, "MypageFrontendStack", { env });

// GitHub Actionsによるデプロイを許可するOICDプロバイダーのデプロイ
new GithubCiCdStack(app, "GithubCiCdStack", { env });
