## Images

A macOS capture carries the profile of the screen it was taken on. WebP drops
that profile, the browser then reads wide-gamut pixels as sRGB, and the colours
go dull. Convert to sRGB before encoding, with
`/System/Library/ColorSync/Profiles/sRGB Profile.icc`, and a Mac shot lands on
the colours of a Windows one.
