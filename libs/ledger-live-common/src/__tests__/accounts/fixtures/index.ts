import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";

export const createCryptoCurrency = (family: string): CryptoCurrency => ({
  type: "CryptoCurrency",
  id: "testCoinId",
  coinType: 8008,
  name: "MyCoin",
  managerAppName: "MyCoin",
  ticker: "MYC",
  countervalueTicker: "MYC",
  scheme: "mycoin",
  color: "#ff0000",
  family,
  units: [
    {
      name: "MYC",
      code: "MYC",
      magnitude: 8,
    },
    {
      name: "SmallestUnit",
      code: "SMALLESTUNIT",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      address: "https://mycoinexplorer.com/account/$address",
      tx: "https://mycoinexplorer.com/transaction/$hash",
      token: "https://mycoinexplorer.com/token/$contractAddress/?a=$address",
    },
  ],
});

const defaultEthCryptoFamily = createCryptoCurrency("ethereum");
export const createAccount = (
  id?: string,
  crypto: CryptoCurrency = defaultEthCryptoFamily
): Account => ({
  type: "Account",
  id: id ?? "ethereumjs:2:ethereum:0x01:",
  seedIdentifier: "0x01",
  derivationMode: "ethM",
  index: 0,
  freshAddress: "0x01",
  freshAddressPath: "44'/60'/0'/0/0",
  freshAddresses: [],
  name: "Ethereum 1",
  starred: false,
  used: false,
  balance: new BigNumber("51281813126095913"),
  spendableBalance: new BigNumber("51281813126095913"),
  creationDate: new Date(),
  blockHeight: 8168983,
  currency: crypto,
  unit: {
    name: "satoshi",
    code: "BTC",
    magnitude: 5,
  },
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  lastSyncDate: new Date(),
  balanceHistoryCache: {
    HOUR: {
      balances: [],
      latestDate: undefined,
    },
    DAY: {
      balances: [],
      latestDate: undefined,
    },
    WEEK: {
      balances: [],
      latestDate: undefined,
    },
  },
  swapHistory: [],
});
