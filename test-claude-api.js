#!/usr/bin/env node

/**
 * Claude API 测试脚本
 * 用于验证 API 密钥和端点配置是否正确
 */

const Anthropic = require('@anthropic-ai/sdk');

async function testClaudeAPI() {
  console.log('=== Claude API 配置测试 ===\n');

  // 检查环境变量
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseURL = process.env.ANTHROPIC_BASE_URL;

  console.log('1. 检查环境变量:');
  console.log(`   ANTHROPIC_API_KEY: ${apiKey ? '✓ 已设置 (' + apiKey.substring(0, 20) + '...)' : '✗ 未设置'}`);
  console.log(`   ANTHROPIC_BASE_URL: ${baseURL || '使用默认值 (https://api.anthropic.com)'}`);

  if (!apiKey) {
    console.error('\n错误: 未设置 ANTHROPIC_API_KEY 环境变量');
    console.log('请在 .env.local 文件中设置正确的 API 密钥\n');
    process.exit(1);
  }

  // 创建 Anthropic 客户端
  const anthropic = new Anthropic({
    apiKey: apiKey,
    baseURL: baseURL,
  });

  console.log('\n2. 测试 API 连接:');
  console.log('   发送测试消息...');

  try {
    const startTime = Date.now();

    // 测试流式响应
    const stream = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: '请简单介绍一下你自己',
        },
      ],
      stream: true,
    });

    let fullResponse = '';
    let chunkCount = 0;

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        fullResponse += event.delta.text;
        chunkCount++;
        process.stdout.write('.');
      }

      if (event.type === 'message_stop') {
        const duration = Date.now() - startTime;
        console.log('\n');
        console.log('✓ API 调用成功!');
        console.log(`   耗时: ${duration}ms`);
        console.log(`   接收块数: ${chunkCount}`);
        console.log(`   响应长度: ${fullResponse.length} 字符`);
        console.log('\n3. 响应内容预览:');
        console.log('   ' + fullResponse.substring(0, 200) + (fullResponse.length > 200 ? '...' : ''));
      }
    }

    console.log('\n=== 测试完成 ===');
    console.log('✓ Claude API 配置正确，可以正常使用\n');

  } catch (error) {
    console.log('\n✗ API 调用失败\n');
    console.error('错误详情:');
    console.error(`   类型: ${error.name}`);
    console.error(`   消息: ${error.message}`);

    if (error.status) {
      console.error(`   HTTP 状态码: ${error.status}`);
    }

    if (error.error) {
      console.error(`   API 错误: ${JSON.stringify(error.error, null, 2)}`);
    }

    console.log('\n常见问题排查:');
    console.log('1. 检查 API 密钥是否有效');
    console.log('2. 检查 API 端点是否可访问');
    console.log('3. 检查网络连接');
    console.log('4. 检查 API 配额是否已用尽\n');

    process.exit(1);
  }
}

// 运行测试
testClaudeAPI().catch((error) => {
  console.error('测试脚本异常:', error);
  process.exit(1);
});
