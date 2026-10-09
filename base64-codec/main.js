export function activate(ctx) {
  const h = ctx.h

  const input = ctx.ref('')
  const output = ctx.ref('')
  const error = ctx.ref('')
  const copied = ctx.ref(false)
  const urlSafe = ctx.ref(false)

  function getStats(text) {
    if (!text) return null
    return { bytes: new TextEncoder().encode(text).length, chars: text.length }
  }

  // UTF-8 安全的 Base64 编码（分块避免大输入时栈溢出）
  function encodeBase64(text) {
    const bytes = new TextEncoder().encode(text)
    let bin = ''
    const CHUNK = 0x8000
    for (let i = 0; i < bytes.length; i += CHUNK) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK))
    }
    let b64 = btoa(bin)
    if (urlSafe.value) {
      b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    }
    return b64
  }

  // UTF-8 安全的 Base64 解码（自动兼容标准 / URL-safe 变体，忽略空白）
  function decodeBase64(b64) {
    let s = b64.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
    while (s.length % 4) s += '='
    const bin = atob(s)
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0))
    // fatal: true —— 非法 UTF-8 序列直接抛错
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  }

  function encode() {
    error.value = ''
    output.value = ''
    if (!input.value) return
    try {
      output.value = encodeBase64(input.value)
    } catch (e) {
      error.value = '编码失败: ' + e.message
    }
  }

  function decode() {
    error.value = ''
    output.value = ''
    if (!input.value) return
    try {
      output.value = decodeBase64(input.value)
    } catch {
      error.value = '无效的 Base64 字符串（请检查输入是否完整、字符集是否正确）'
    }
  }

  function swap() {
    if (!output.value) return
    const prev = input.value
    input.value = output.value
    output.value = prev
    error.value = ''
  }

  function clearAll() {
    input.value = ''
    output.value = ''
    error.value = ''
  }

  function pasteFromClipboard() {
    navigator.clipboard.readText().then(text => {
      input.value = text
      output.value = ''
      error.value = ''
    }).catch(() => {
      ctx.ui.notify('无法读取剪贴板', 'warn')
    })
  }

  async function copyOutput() {
    if (!output.value) return
    try {
      await navigator.clipboard.writeText(output.value)
      copied.value = true
      setTimeout(() => { copied.value = false }, 1500)
    } catch {
      ctx.ui.notify('复制失败', 'error')
    }
  }

  function useOutput() {
    if (!output.value) return
    input.value = output.value
    output.value = ''
    error.value = ''
  }

  // ── Commands ──────────────────────────────────────────────────────────────────

  ctx.commands.register('base64-codec.open', () => { ctx.open() })

  // ── Render ────────────────────────────────────────────────────────────────────

  return {
    component: {
      render() {
        const inputStats = getStats(input.value)
        const outputStats = getStats(output.value)
        const hasOutput = !!output.value

        return h('div', { class: 'b64-root' }, [

          // Header
          h('div', { class: 'b64-header' }, [
            h('h2', { class: 'b64-title' }, 'Base64 Codec'),
            h('div', { class: 'b64-header-opts' }, [
              h('label', { class: 'b64-opt-label' }, [
                h('input', {
                  type: 'checkbox',
                  class: 'b64-checkbox',
                  checked: urlSafe.value,
                  onChange: e => { urlSafe.value = e.target.checked },
                }),
                'URL-safe (-_ 替换 +/，去填充)',
              ]),
            ]),
          ]),

          // Main layout
          h('div', { class: 'b64-layout' }, [

            // Input panel
            h('div', { class: 'b64-panel' }, [
              h('div', { class: 'b64-panel-header' }, [
                h('span', { class: 'b64-panel-title' }, '输入'),
                inputStats ? h('span', { class: 'b64-stat' }, `${inputStats.chars} 字符 · ${inputStats.bytes}B`) : null,
                h('div', { class: 'b64-panel-actions' }, [
                  h('button', { class: 'b64-btn b64-btn-ghost', onClick: pasteFromClipboard }, '粘贴'),
                  h('button', { class: 'b64-btn b64-btn-ghost', onClick: clearAll }, '清空'),
                ]),
              ].filter(Boolean)),
              h('textarea', {
                class: 'b64-textarea',
                placeholder: '输入文本（编码）或 Base64 字符串（解码）...',
                value: input.value,
                spellcheck: false,
                onInput: e => {
                  input.value = e.target.value
                  error.value = ''
                  output.value = ''
                },
              }),
            ]),

            // Action column
            h('div', { class: 'b64-actions' }, [
              h('button', { class: 'b64-btn b64-btn-primary b64-btn-action', onClick: encode }, '编码 →'),
              h('button', { class: 'b64-btn b64-btn-primary b64-btn-action', onClick: decode }, '解码 →'),
              hasOutput ? h('button', { class: 'b64-btn b64-btn-ghost b64-btn-action', onClick: swap }, '⇅ 互换') : null,
              hasOutput ? h('button', { class: 'b64-btn b64-btn-ghost b64-btn-action', onClick: useOutput }, '← 回填') : null,
            ].filter(Boolean)),

            // Output panel
            h('div', { class: 'b64-panel' }, [
              h('div', { class: 'b64-panel-header' }, [
                h('span', { class: 'b64-panel-title' }, '输出'),
                outputStats ? h('span', { class: 'b64-stat' }, `${outputStats.chars} 字符 · ${outputStats.bytes}B`) : null,
                hasOutput ? h('div', { class: 'b64-panel-actions' }, [
                  h('button', {
                    class: 'b64-btn b64-btn-ghost' + (copied.value ? ' b64-btn-copied' : ''),
                    onClick: copyOutput,
                  }, copied.value ? '已复制 ✓' : '复制'),
                ]) : null,
              ].filter(Boolean)),
              error.value
                ? h('div', { class: 'b64-error' }, [
                    h('span', { class: 'b64-error-icon' }, '✕'),
                    h('span', null, error.value),
                  ])
                : h('textarea', {
                    class: 'b64-textarea b64-textarea-output',
                    readonly: true,
                    spellcheck: false,
                    value: output.value,
                    placeholder: '结果将显示在这里',
                  }),
            ]),
          ]),
        ])
      },
    },
  }
}
