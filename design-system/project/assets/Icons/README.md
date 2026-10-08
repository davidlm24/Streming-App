# Icons

The product's icons are Lucide (`lucide-react`), 24-unit outlines at stroke 1.75 with round caps and joins, drawn in `currentColor`, `aria-hidden`, with the accessible name on the control. Sizes: 16px in rows, buttons and chat; 14px inside menus and chips; 18px in the tool rail; 12px beside a text action.

Platform marks use the same set and the same stroke, in the ink of their context, never the owner's brand colours: `youtube`, `twitch`, `facebook`, `instagram`, `linkedin`, `music-2` for TikTok, `circle-play` for Rumble, `twitter` for X, `server` for RTMP destinations, `tv` as the fallback. The only one Lucide lacks is Kick:

- `kick.svg`: the K drawn in the product's stroke. Its ink is `n-96` (#F0F5F9) baked in for this file; the bundle's `PlatformIcon` draws it in `currentColor`.

The one coloured third-party mark in the product is Google's G on the sign-in button, in Google's four colours, because Google's brand rules require it.
