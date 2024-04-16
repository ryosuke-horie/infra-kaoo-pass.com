import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { describe, expect, it } from "vitest";
import { AdminFrontendStack } from "../lib/admin-frontend-stack";

describe("AdminFrontendStack", () => {
	it("should create the correct resources", () => {
		const app = new cdk.App();
		const stack = new AdminFrontendStack(app, "TestAdminFrontendStack", {
			env: { region: "ap-northeast-1", account: "905418074681" },
		});
		const template = Template.fromStack(stack);

		expect(template.toJSON()).toMatchSnapshot();
	});
});
