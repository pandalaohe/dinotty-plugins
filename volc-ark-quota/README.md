# Volcano Ark Quota

Display Volcano Engine Ark Flow Plan (AFP) quota in dinotty's Monitor tab and status bar.

## Monitor series

The plugin contributes 3 monitor series for the currently **active** account (one chart each in Settings -> Monitor -> 插件指标, plus a compact status bar entry):

| id | label | meaning |
|----|-------|---------|
| `volc-ark-quota:fiveHour` | `Volcano Ark · 5-hour rolling window` | 5-hour rolling window usage |
| `volc-ark-quota:weekly` | `Volcano Ark · weekly quota` | weekly quota usage |
| `volc-ark-quota:monthly` | `Volcano Ark · monthly quota` | monthly quota usage |

Each series is sampled at ~1s cadence by the framework and rendered as a 60-point percent Line chart. The status bar entry shows `label: percentage%` (e.g. `5h: 38%`); click opens a popover with the chart and detail rows (used/total/reset time/last refresh).

The Agent Plan tiers (small / medium / large) only report 5h / weekly / monthly quotas -- the `AFPDaily` field in the API response is a non-applicable placeholder, so no daily series is contributed.

## Multi-account

The plugin's config tab (PluginView -> Volcano Ark Quota) lets you manage multiple Volcano Engine accounts:

- **Add account**: enter label + Access Key ID + Secret Access Key
- **Set active**: pick which account's quota drives the series
- **Edit / Delete**: manage existing accounts

Account credentials are stored in plugin storage via `ctx.storage` (server-side persisted JSON). They are used only to sign Volcano API requests.

## Refresh

- Automatic every 5 minutes (300s)
- On settings change (provider switch via cc-switch, etc.)
- Via command palette: `Refresh Volcano Ark quota`

## API

```
POST https://ark.cn-beijing.volcengineapi.com/?Action=GetAFPUsage&Version=2024-01-01
Content-Type: application/json; charset=utf-8
Host: ark.cn-beijing.volcengineapi.com
X-Date: <UTC datetime, YYYYMMDDTHHMMSSZ>
X-Content-Sha256: <sha256 of body>
Authorization: HMAC-SHA256 Credential=<AK>/<date>/<region>/<service>/request, SignedHeaders=content-type;host;x-content-sha256;x-date, Signature=<hex>
Body: {}
```

Response shape (truncated):

```json
{
  "ResponseMetadata": { "RequestId": "...", "Action": "GetAFPUsage", "Version": "2024-01-01", "Service": "ark", "Region": "cn-beijing" },
  "Result": {
    "PlanType": "...",
    "AFPFiveHour":  { "Quota": 100.0, "Used": 38.0, "SubscribeTime": 0, "ResetTime": 0 },
    "AFPDaily":     { "Quota": 100.0, "Used": 42.0, "SubscribeTime": 0, "ResetTime": 0 },
    "AFPWeekly":    { "Quota": 100.0, "Used": 60.0, "SubscribeTime": 0, "ResetTime": 0 },
    "AFPMonthly":   { "Quota": 100.0, "Used": 75.0, "SubscribeTime": 0, "ResetTime": 0 }
  }
}
```

Auth is Volcano Engine signature v4 (HMAC-SHA256), matching the official `volcenginesdkcore.SignerV4` implementation exactly. The signing key is derived per AWS Sig v4:

```
k_date    = HMAC(secret, YYYYMMDD)
k_region  = HMAC(k_date,    "cn-beijing")
k_service = HMAC(k_region,  "ark")
k_signing = HMAC(k_service, "request")
signature = HMAC(k_signing, string_to_sign)
```

Signed headers: `content-type;host;x-content-sha256;x-date` (sorted, each followed by `\n` in the canonical headers block).

HTTP requests are issued via `ctx.exec.run([...])`, which runs the plugin's declared `bin` (a thin curl wrapper at `bin/volc-ark-quota`) to bypass browser CORS.

## Why not use the Agent Plan API Key?

The Agent Plan dedicated API Key (`ark-...` format) only authorizes the Volcano Ark **inference API** (`/api/v3/*`). The `GetAFPUsage` OpenAPI endpoint rejects it -- only AK/SK HMAC signing is accepted. If you try, you'll see `AuthenticationError: the API key or AK/SK in the request is missing or invalid`.

## Host name caveat

The Ark OpenAPI host is `ark.cn-beijing.volcengineapi.com`. The similarly-named `ark.cn-beijing.volces.com` is the inference API host and rejects AK/SK-signed OpenAPI calls with the same `AuthenticationError`. If you see auth failures on a known-good AK/SK, double-check the host.

## Getting AK/SK

1. Visit [Volcano Engine IAM Key Management](https://console.volcengine.com/iam/keymanage/)
2. Create an Access Key (AKLT... format)
3. Copy both the Access Key ID and Secret Access Key
4. In dinotty: open the Volcano Ark Quota plugin tab, click "Add account", paste them in

## Files

```
volc-ark-quota/
  plugin.json    # manifest (id, name, version, icon, bin, commands)
  main.js        # activate() -- config UI + 3 monitor series + Volcano v4 signature
  bin/volc-ark-quota  # bash wrapper that forwards args to curl
  styles.css     # config page styling
```

## TODO

- **Command palette switcher**: add a quickPick for switching active account without opening the config tab
- **Per-account series**: currently only the active account's series render. Extending to show series for all accounts simultaneously requires dynamic series registration (not yet supported by the plugin API).
- **Refresh feedback**: show a spinner / "refreshing..." state while `fetchQuota` is in flight

## License

MIT
