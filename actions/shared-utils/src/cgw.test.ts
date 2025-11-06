import { describe, it } from "vitest"; // or '@jest/globals'
import { loadChainInfo } from "./cgw";

// --- Tests ---
describe("getChainInfo", () => {
	it("should be able to load chain info", async () => {
		console.log(await loadChainInfo("100"));
	});
});
