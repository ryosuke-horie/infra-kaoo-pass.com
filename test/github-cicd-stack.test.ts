import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { describe, expect, it } from "vitest";
import { GithubCiCdStack } from "../lib/github-cicd-stack";

describe("GithubCiCdStack", () => {
	it("should create the correct resources", () => {
		const app = new cdk.App();
		const stack = new GithubCiCdStack(app, "TestGithubCiCdStack", {
			env: { region: "ap-northeast-1", account: "905418074681" },
		});
		const template = Template.fromStack(stack);

		expect(template.toJSON()).toMatchSnapshot();
	});
});
