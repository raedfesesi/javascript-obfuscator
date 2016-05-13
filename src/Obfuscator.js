"use strict";
const estraverse = require('estraverse');
const AppendState_1 = require('./enums/AppendState');
const CatchClauseObfuscator_1 = require("./node-obfuscators/CatchClauseObfuscator");
const FunctionDeclarationObfuscator_1 = require('./node-obfuscators/FunctionDeclarationObfuscator');
const FunctionObfuscator_1 = require('./node-obfuscators/FunctionObfuscator');
const LiteralObfuscator_1 = require('./node-obfuscators/LiteralObfuscator');
const MemberExpressionObfuscator_1 = require('./node-obfuscators/MemberExpressionObfuscator');
const MethodDefinitionObfuscator_1 = require('./node-obfuscators/MethodDefinitionObfuscator');
const ObjectExpressionObfuscator_1 = require('./node-obfuscators/ObjectExpressionObfuscator');
const UnicodeArrayNode_1 = require('./nodes/UnicodeArrayNode');
const UnicodeArrayNodesGroup_1 = require('./node-groups/UnicodeArrayNodesGroup');
const Utils_1 = require('./Utils');
const VariableDeclarationObfuscator_1 = require('./node-obfuscators/VariableDeclarationObfuscator');
class Obfuscator {
    constructor(options) {
        this.nodes = new Map();
        this.nodeObfuscators = new Map([
            ['ClassDeclaration', [FunctionDeclarationObfuscator_1.FunctionDeclarationObfuscator]],
            ['CatchClause', [CatchClauseObfuscator_1.CatchClauseObfuscator]],
            ['FunctionDeclaration', [
                    FunctionDeclarationObfuscator_1.FunctionDeclarationObfuscator,
                    FunctionObfuscator_1.FunctionObfuscator
                ]],
            ['ArrowFunctionExpression', [FunctionObfuscator_1.FunctionObfuscator]],
            ['FunctionExpression', [FunctionObfuscator_1.FunctionObfuscator]],
            ['MethodDefinition', [MethodDefinitionObfuscator_1.MethodDefinitionObfuscator]],
            ['VariableDeclaration', [VariableDeclarationObfuscator_1.VariableDeclarationObfuscator]],
            ['ObjectExpression', [ObjectExpressionObfuscator_1.ObjectExpressionObfuscator]],
            ['MemberExpression', [MemberExpressionObfuscator_1.MemberExpressionObfuscator]],
            ['Literal', [LiteralObfuscator_1.LiteralObfuscator]]
        ]);
        this.options = {
            rotateUnicodeArray: true
        };
        Object.assign(this.options, options);
    }
    obfuscateNode(node) {
        if (this.options['rotateUnicodeArray']) {
            this.setNodesGroup(new UnicodeArrayNodesGroup_1.UnicodeArrayNodesGroup(node));
        }
        else {
            this.setNode('unicodeArrayNode', new UnicodeArrayNode_1.UnicodeArrayNode(node, Utils_1.Utils.getRandomVariableName(UnicodeArrayNode_1.UnicodeArrayNode.UNICODE_ARRAY_RANDOM_LENGTH)));
        }
        this.beforeObfuscation(node);
        estraverse.replace(node, {
            enter: (node, parent) => this.nodeControllerFirstPass(node, parent)
        });
        estraverse.replace(node, {
            leave: (node, parent) => this.nodeControllerSecondPass(node, parent)
        });
        this.afterObfuscation(node);
    }
    setNode(nodeName, node) {
        this.nodes.set(nodeName, node);
    }
    setNodesGroup(nodesGroup) {
        let nodes = nodesGroup.getNodes();
        nodes.forEach((node, key) => {
            this.nodes.set(key, node);
        });
    }
    afterObfuscation(node) {
        this.nodes.forEach((node) => {
            if (node.getAppendState() === AppendState_1.AppendState.AfterObfuscation) {
                node.appendNode();
            }
        });
    }
    beforeObfuscation(node) {
        this.nodes.forEach((node) => {
            if (node.getAppendState() === AppendState_1.AppendState.BeforeObfuscation) {
                node.appendNode();
            }
        });
    }
    ;
    nodeControllerFirstPass(node, parent) {
        Object.defineProperty(node, 'parentNode', {
            enumerable: true,
            configurable: true,
            writable: true,
            value: parent || node
        });
    }
    nodeControllerSecondPass(node, parent) {
        switch (node.type) {
            default:
                this.initializeNodeObfuscators(node, parent);
        }
    }
    initializeNodeObfuscators(node, parent) {
        if (!this.nodeObfuscators.has(node.type)) {
            return;
        }
        this.nodeObfuscators.get(node.type).forEach((obfuscator) => {
            new obfuscator(this.nodes).obfuscateNode(node, parent);
        });
    }
}
exports.Obfuscator = Obfuscator;