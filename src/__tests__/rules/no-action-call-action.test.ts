import { createTester } from '../setup';
import rule from '../../rules/no-action-call-action';

const tester = createTester();

tester.run('no-action-call-action', rule, {
  valid: [
    // Normal code calling executeAction (not in an Action class)
    `class UserService {
      async run() {
        await this.executeAction("Send Email", {}, user);
      }
    }`,
    // Action class using direct imports (correct pattern)
    `class SummarizeContentAction extends BaseAction {
      async run() {
        const runner = new AIPromptRunner();
        const result = await runner.ExecutePrompt(params);
      }
    }`,
    // Non-this calls to executeAction inside an Action
    `class MyAction extends BaseAction {
      async run() {
        await someOtherObject.executeAction("foo", {});
      }
    }`,
    // Action class calling a different method on this
    `class MyAction extends BaseAction {
      async run() {
        await this.validate();
        await this.transform();
      }
    }`,
    // Not an Action class despite having Action in name (no extends)
    `class FakeAction {
      async run() {
        await this.executeAction("foo", {});
      }
    }`,
    // executeAction on a variable, not this
    `class ExportAction extends BaseAction {
      async run() {
        await actionRunner.executeAction("foo", {});
      }
    }`,
  ],
  invalid: [
    // BaseAction subclass calling this.executeAction
    {
      code: `class SummarizeAction extends BaseAction {
        async generateSummary() {
          const result = await this.executeAction("Execute AI Prompt", params, user);
        }
      }`,
      errors: [{ messageId: 'noActionCallAction' }],
    },
    // BaseActionImplementation subclass
    {
      code: `class ExportAction extends BaseActionImplementation {
        async run() {
          await this.executeAction("Send Email", {}, user);
        }
      }`,
      errors: [{ messageId: 'noActionCallAction' }],
    },
    // Namespace extends
    {
      code: `class MyAction extends MJ.BaseAction {
        async run() {
          await this.executeAction("Other Action", params, user);
        }
      }`,
      errors: [{ messageId: 'noActionCallAction' }],
    },
    // Name-based detection (ends with Action, has action-like pattern)
    {
      code: `class SendEmailAction extends SomethingAction {
        async run() {
          await this.executeAction("Get Data", {}, user);
        }
      }`,
      errors: [{ messageId: 'noActionCallAction' }],
    },
    // Multiple calls in one Action
    {
      code: `class ChainedAction extends BaseAction {
        async run() {
          await this.executeAction("Step 1", {}, user);
          await this.executeAction("Step 2", {}, user);
        }
      }`,
      errors: [
        { messageId: 'noActionCallAction' },
        { messageId: 'noActionCallAction' },
      ],
    },
    // RunAction variant
    {
      code: `class MyAction extends BaseAction {
        async run() {
          await this.RunAction("Other", {}, user);
        }
      }`,
      errors: [{ messageId: 'noActionCallAction' }],
    },
  ],
});
