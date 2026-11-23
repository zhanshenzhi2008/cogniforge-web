import { describe, expect, it } from 'vitest'
import {
  detectUnsupportedBuildIntents,
  extractAgentBuildConfig,
  listUnresolvedBuildTools,
  resolveBuildToolIds,
  stripAgentBuildFence,
} from '../agentBuildConfig'

describe('extractAgentBuildConfig', () => {
  it('parses agent-config fence and keeps display text', () => {
    const raw = [
      '好的，已按客服场景配好。',
      '```agent-config',
      JSON.stringify({
        name: '客服助手',
        description: '售前咨询',
        system_prompt: '你是客服',
        tools: ['web_search', '网络搜索'],
      }),
      '```',
    ].join('\n')
    const { display, config } = extractAgentBuildConfig(raw)
    expect(display).toContain('客服场景')
    expect(config?.name).toBe('客服助手')
    expect(config?.system_prompt).toBe('你是客服')
    expect(config?.tools).toEqual(['web_search', '网络搜索'])
  })

  it('falls back to whole text as system_prompt without fence', () => {
    const { display, config } = extractAgentBuildConfig('你是一个助手')
    expect(display).toBe('你是一个助手')
    expect(config?.system_prompt).toBe('你是一个助手')
  })
})

describe('resolveBuildToolIds', () => {
  const catalog = [
    { id: 'mcp-1', name: '网络搜索' },
    { id: 'mcp-2', name: '网页抓取' },
  ]

  it('matches by id or name', () => {
    expect(resolveBuildToolIds(['mcp-1', '网页抓取', '未知'], catalog)).toEqual(['mcp-1', 'mcp-2'])
  })
})

describe('stripAgentBuildFence', () => {
  it('removes fence for display', () => {
    expect(stripAgentBuildFence('说明\n```cfg\n{}\n```')).toBe('说明')
  })
})

describe('listUnresolvedBuildTools', () => {
  const catalog = [{ id: 'mcp-1', name: '网络搜索' }]

  it('lists names that do not resolve', () => {
    expect(listUnresolvedBuildTools(['网络搜索', '飞书机器人'], catalog)).toEqual(['飞书机器人'])
  })
})

describe('detectUnsupportedBuildIntents', () => {
  it('flags vm / voice / install asks', () => {
    expect(detectUnsupportedBuildIntents('帮我开个虚拟机跑代码')).toContain('vm')
    expect(detectUnsupportedBuildIntents('加上语音播放')).toContain('voice')
    expect(detectUnsupportedBuildIntents('安装一个新的 MCP 工具')).toContain('unknown_tool_install')
  })

  it('ignores normal build asks', () => {
    expect(detectUnsupportedBuildIntents('做一个能网络搜索的客服')).toEqual([])
  })
})
