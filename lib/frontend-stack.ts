import {
	Duration,
	RemovalPolicy,
	Stack,
	type StackProps,
	aws_cloudfront,
	aws_cloudfront_origins,
	aws_iam,
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

		// OAIを作成する
		const originAccessIdentity = new aws_cloudfront.OriginAccessIdentity(
			this,
			"OriginAccessIdentity",
			{
				comment: "website-distribution-originAccessIdentity",
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

		// S3バケットポリシーにステートメントを追加する
		websiteBucket.addToResourcePolicy(websiteBucketPolicyStatement);

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
	}
}
