import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { describe, expect, it } from "vitest";
import { MypageFrontendStack } from "../lib/mypage-frontend-stack";

describe("MypageFrontendStack", () => {
	it("should create the correct resources", () => {
		const app = new cdk.App();
		const stack = new MypageFrontendStack(app, "TestMypageFrontendStack", {
			env: { region: "ap-northeast-1", account: "905418074681" },
		});
		const template = Template.fromStack(stack);

		expect(template.toJSON()).toMatchSnapshot();
	});
});
