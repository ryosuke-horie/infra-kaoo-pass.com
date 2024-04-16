import {
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
export class MypageFrontendStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		// S3バケットを作成する
		const mypageWebsiteBucket = new aws_s3.Bucket(this, "mypageWebsiteBucket", {
			removalPolicy: RemovalPolicy.DESTROY,
		});

		// OAIを作成する
		const originAccessIdentity = new aws_cloudfront.OriginAccessIdentity(
			this,
			"OriginAccessIdentity",
			{
				comment: "mypage-website-distribution-originAccessIdentity",
			},
		);

		// S3バケットポリシーを作成する。OAIからのみアクセス可能とする
		const mypageWebsiteBucketPolicyStatement = new aws_iam.PolicyStatement({
			// GETのみ許可
			actions: ["s3:GetObject"],
			effect: aws_iam.Effect.ALLOW,
			principals: [
				new aws_iam.CanonicalUserPrincipal(
					originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId,
				),
			],
			resources: [`${mypageWebsiteBucket.bucketArn}/*`],
		});

		// S3バケットポリシーにステートメントを追加する
		mypageWebsiteBucket.addToResourcePolicy(mypageWebsiteBucketPolicyStatement);

		// 利用するホストゾーンをドメイン名で取得
		// ホストゾーンIDを取得;
		const hostedZoneId = route53.HostedZone.fromLookup(this, "HostedZoneId", {
			domainName: "kaoo-pass.com",
		});

		// 証明書を取得
		const certificate = Certificate.fromCertificateArn(
			this,
			"Certificate",
			"arn:aws:acm:us-east-1:905418074681:certificate/bfb07cff-ec5d-4b66-af24-2d45086a0ace",
		);

		// CloudFrontディストリビューションを作成する
		const distribution = new aws_cloudfront.Distribution(this, "Distribution", {
			domainNames: ["mypage.kaoo-pass.com"],
			certificate,
			comment: "mypage.kaoo-pass.com",
			defaultRootObject: "index.html",
			defaultBehavior: {
				allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
				cachedMethods: aws_cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
				cachePolicy: aws_cloudfront.CachePolicy.CACHING_OPTIMIZED,
				viewerProtocolPolicy:
					aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
				origin: new aws_cloudfront_origins.S3Origin(mypageWebsiteBucket, {
					originAccessIdentity,
				}),
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

		// Route53レコード設定
		new route53.ARecord(this, "ARecord", {
			zone: hostedZoneId,
			target: route53.RecordTarget.fromAlias(
				new targets.CloudFrontTarget(distribution),
			),
			recordName: "mypage.kaoo-pass.com",
		});
	}
}
