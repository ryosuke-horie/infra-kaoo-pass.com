import {
	RemovalPolicy,
	Stack,
	type StackProps,
	aws_cloudfront,
	aws_cloudfront_origins,
	aws_iam,
	aws_lambda,
	aws_s3,
} from "aws-cdk-lib";
import type { Construct } from "constructs";

import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";

/**
 * CloudFront + S3でホスティング用のStackを作成する
 */
export class FrontendStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		// S3バケットを作成する
		const websiteBucket = new aws_s3.Bucket(this, "WebsiteBucket", {
			removalPolicy: RemovalPolicy.DESTROY,
		});

		// 画像用のS3バケットを作成する
		const imageBucket = new aws_s3.Bucket(this, "ImageBucket", {
			removalPolicy: RemovalPolicy.DESTROY,
		});

		// OAIを作成する
		const originAccessIdentity = new aws_cloudfront.OriginAccessIdentity(
			this,
			"OriginAccessIdentity",
			{
				comment: "website-distribution-originAccessIdentity",
			},
		);

		// OAIを作成する
		const imageOriginAccessIdentity = new aws_cloudfront.OriginAccessIdentity(
			this,
			"ImageOriginAccessIdentity",
			{
				comment: "image-distribution-originAccessIdentity",
			},
		);

		// S3バケットポリシーを作成する。OAIからのみアクセス可能とする
		const websiteBucketPolicyStatement = new aws_iam.PolicyStatement({
			// GETのみ許可
			actions: ["s3:GetObject"],
			effect: aws_iam.Effect.ALLOW,
			principals: [
				new aws_iam.CanonicalUserPrincipal(
					originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId,
				),
			],
			resources: [`${websiteBucket.bucketArn}/*`],
		});

		// S3バケットポリシーを作成する。OAIからのみアクセス可能とする
		const imageBucketPolicyStatement = new aws_iam.PolicyStatement({
			// GETのみ許可
			actions: ["s3:GetObject"],
			effect: aws_iam.Effect.ALLOW,
			principals: [
				new aws_iam.CanonicalUserPrincipal(
					imageOriginAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId,
				),
			],
			resources: [`${imageBucket.bucketArn}/*`],
		});

		// S3バケットポリシーにステートメントを追加する
		websiteBucket.addToResourcePolicy(websiteBucketPolicyStatement);

		// S3バケットポリシーにステートメントを追加する
		imageBucket.addToResourcePolicy(imageBucketPolicyStatement);

		// // 利用するホストゾーンをドメイン名で取得
		// // ホストゾーンIDを取得
		const hostedZoneId = route53.HostedZone.fromLookup(this, "HostedZoneId", {
			domainName: "kaoo-pass.com",
		});

		// // 証明書を取得
		const certificate = Certificate.fromCertificateArn(
			this,
			"Certificate",
			"arn:aws:acm:us-east-1:905418074681:certificate/01d9e454-018a-4063-96f8-b20ad66ea2c1",
		);

		// CloudFrontディストリビューションを作成する
		const distribution = new aws_cloudfront.Distribution(this, "Distribution", {
			domainNames: ["kaoo-pass.com"],
			certificate,
			comment: "kaoo-pass.com",
			defaultRootObject: "index.html",
			defaultBehavior: {
				allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
				cachedMethods: aws_cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
				cachePolicy: aws_cloudfront.CachePolicy.CACHING_OPTIMIZED,
				viewerProtocolPolicy:
					aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
				origin: new aws_cloudfront_origins.S3Origin(websiteBucket, {
					originAccessIdentity,
				}),
			},
			// 画像用のビヘイビアを追加する
			additionalBehaviors: {
				"/images/*": {
					origin: new aws_cloudfront_origins.S3Origin(imageBucket, {
						originAccessIdentity: imageOriginAccessIdentity,
					}),
					viewerProtocolPolicy:
						aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
					allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD,
					cachedMethods: aws_cloudfront.CachedMethods.CACHE_GET_HEAD,
					compress: true,
					originRequestPolicy:
						aws_cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
					responseHeadersPolicy:
						aws_cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
				},
			},

			// 403エラーの時に「/」に飛ばす(SPAのため、リロードや直アクセスに対策するため)
			errorResponses: [
				{
					httpStatus: 403,
					responseHttpStatus: 200,
					responsePagePath: "/",
				},
			],
			priceClass: aws_cloudfront.PriceClass.PRICE_CLASS_100,
		});

		// // Route53レコード設定
		new route53.ARecord(this, "ARecord", {
			zone: hostedZoneId,
			target: route53.RecordTarget.fromAlias(
				new targets.CloudFrontTarget(distribution),
			),
			recordName: "kaoo-pass.com",
		});

		// 画像用S3へのアクセス権限を追加
		// BackendのAPI用Lambdaを検索する
		const apiLambdaRole = aws_iam.Role.fromRoleArn(
			this,
			"ApiLambdaRole",
			"arn:aws:iam::905418074681:role/laravel-api-dev-ap-northeast-1-lambdaRole",
		);

		// API用LambdaにS3バケットへのアクセス権限を追加する
		imageBucket.grantReadWrite(apiLambdaRole);
	}
}
