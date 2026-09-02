import { expect, test } from "vitest";

import type { Ad } from "../src/types.ts";
import { decodeAd } from "../src/encrypted.ts";

const BASE64_AD: Ad = {
  adId: "TjZzS1Vpa0s=",
  message:
    "SW52ZXN0aWdhdGUgSmFzdmluZGVyIEV5bWVyIGFuZCBmaW5kIG91dCB0aGVpciByZWxhdGlvbiB0byB0aGUgbWFnaWMgdHVybmlwcy4=",
  reward: 176,
  expiresIn: 3,
  encrypted: 1,
  probability: "U3VpY2lkZSBtaXNzaW9u",
};

const ROT13_AD: Ad = {
  adId: "nVq55QnU",
  message:
    "Xvyy Vmvqbe Qbanyqf jvgu jntba naq znxr Orabîgr Furygba sebz zbhagnvaf va Oybbqurneg gb gnxr gur oynzr",
  reward: 139,
  expiresIn: 2,
  encrypted: 2,
  probability: "Vzcbffvoyr",
};

test("leaves plaintext ads alone", () => {
  const plain = { ...BASE64_AD, encrypted: null };

  expect(decodeAd(plain)).toBe(plain);
});

test("decodes encrypted:1 as base64", () => {
  expect(decodeAd(BASE64_AD)).toEqual({
    adId: "N6sKUikK",
    message: "Investigate Jasvinder Eymer and find out their relation to the magic turnips.",
    reward: 176,
    expiresIn: 3,
    encrypted: null,
    probability: "Suicide mission",
  });
});

test("decodes encrypted:2 as rot13", () => {
  expect(decodeAd(ROT13_AD)).toEqual({
    adId: "aId55DaH",
    message:
      "Kill Izidor Donalds with wagon and make Benoîte Shelton from mountains in Bloodheart to take the blame",
    reward: 139,
    expiresIn: 2,
    encrypted: null,
    probability: "Impossible",
  });
});

test("skips unknown encrypted values", () => {
  expect(decodeAd({ ...BASE64_AD, encrypted: 7 })).toBeNull();
});
