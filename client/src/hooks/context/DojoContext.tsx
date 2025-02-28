import { ReactComponent as CartridgeSmall } from "@/assets/icons/cartridge-small.svg";
import { SetupNetworkResult } from "@/dojo/setupNetwork";
import { LoadingScreen } from "@/ui/modules/LoadingScreen";
import ControllerConnector from "@cartridge/connector/controller";
import { BurnerProvider, useBurnerManager } from "@dojoengine/create-burner";
import { useAccount, useConnect } from "@starknet-react/core";
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { Account, AccountInterface, RpcProvider } from "starknet";
import { Env, env } from "../../../env";
import { SetupResult } from "../../dojo/setup";
import { displayAddress, getRandomBackgroundImage } from "../../ui/utils/utils";
import { useAccountStore } from "./accountStore";

interface DojoAccount {
  create: () => void;
  list: () => any[];
  get: (id: string) => any;
  select: (id: string) => void;
  account: Account | AccountInterface;
  isDeploying: boolean;
  clear: () => void;
  accountDisplay: string;
}

interface DojoContextType extends SetupResult {
  masterAccount: Account | AccountInterface;
  account: DojoAccount;
}

export interface DojoResult {
  setup: DojoContextType;
  account: DojoAccount;
  network: SetupNetworkResult;
  masterAccount: Account | AccountInterface;
}

const DojoContext = createContext<DojoContextType | null>(null);

const requiredEnvs: (keyof Env)[] = [
  "VITE_PUBLIC_MASTER_ADDRESS",
  "VITE_PUBLIC_MASTER_PRIVATE_KEY",
  "VITE_PUBLIC_ACCOUNT_CLASS_HASH",
];

for (const _env of requiredEnvs) {
  if (!env[_env]) {
    throw new Error(`Environment variable ${_env} is not set!`);
  }
}

type DojoProviderProps = {
  children: ReactNode;
  value: SetupResult;
};

const useMasterAccount = (rpcProvider: RpcProvider) => {
  const masterAddress = env.VITE_PUBLIC_MASTER_ADDRESS;
  const privateKey = env.VITE_PUBLIC_MASTER_PRIVATE_KEY;
  return useMemo(() => new Account(rpcProvider, masterAddress, privateKey), [rpcProvider, masterAddress, privateKey]);
};

const useRpcProvider = () => {
  return useMemo(
    () =>
      new RpcProvider({
        nodeUrl: env.VITE_PUBLIC_NODE_URL || "http://localhost:5050",
      }),
    [],
  );
};

const useControllerAccount = () => {
  const { account, connector, isConnected } = useAccount();

  useEffect(() => {
    if (account) {
      useAccountStore.getState().setAccount(account);
    }
  }, [account, isConnected]);

  useEffect(() => {
    if (connector) {
      useAccountStore.getState().setConnector(connector as unknown as ControllerConnector);
    }
  }, [connector, isConnected]);

  return account;
};

export const DojoProvider = ({ children, value }: DojoProviderProps) => {
  const currentValue = useContext(DojoContext);
  if (currentValue) throw new Error("DojoProvider can only be used once");

  const rpcProvider = useRpcProvider();
  const masterAccount = useMasterAccount(rpcProvider);
  const controllerAccount = useControllerAccount();

  return (
    <BurnerProvider
      initOptions={{
        masterAccount,
        accountClassHash: env.VITE_PUBLIC_ACCOUNT_CLASS_HASH,
        rpcProvider,
        feeTokenAddress: env.VITE_PUBLIC_FEE_TOKEN_ADDRESS,
      }}
    >
      <DojoContextProvider value={value} masterAccount={masterAccount} controllerAccount={controllerAccount!}>
        {children}
      </DojoContextProvider>
    </BurnerProvider>
  );
};

export const useDojo = (): DojoResult => {
  const contextValue = useContext(DojoContext);
  if (!contextValue) throw new Error("The `useDojo` hook must be used within a `DojoProvider`");

  return {
    setup: contextValue,
    account: contextValue.account,
    network: contextValue.network,
    masterAccount: contextValue.masterAccount,
  };
};

const DojoContextProvider = ({
  children,
  value,
  masterAccount,
  controllerAccount,
}: DojoProviderProps & { masterAccount: Account; controllerAccount: AccountInterface | null }) => {
  const currentValue = useContext(DojoContext);
  if (currentValue) throw new Error("DojoProvider can only be used once");

  const {
    create,
    list,
    get,
    account: burnerAccount,
    select,
    isDeploying,
    clear,
  } = useBurnerManager({
    burnerManager: value.network.burnerManager,
  });

  const { connect, connectors } = useConnect();
  const { isConnected, isConnecting } = useAccount();

  const [accountsInitialized, setAccountsInitialized] = useState(false);

  const connectWallet = async () => {
    try {
      console.log("Attempting to connect wallet...");
      await connect({ connector: connectors[0] });
      console.log("Wallet connected successfully.");
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  // Determine which account to use based on environment
  const isDev = env.VITE_PUBLIC_DEV === true;
  const accountToUse = isDev ? burnerAccount : controllerAccount;

  useEffect(() => {
    if (isDev) {
      if (burnerAccount) {
        console.log("Setting account from burner hook:", burnerAccount);
        useAccountStore.getState().setAccount(burnerAccount);
        setAccountsInitialized(true);
      } else {
        console.log("Burner account is null in development.");
      }
    } else {
      if (controllerAccount) {
        console.log("Setting account from controllerAccount:", controllerAccount);
        useAccountStore.getState().setAccount(controllerAccount);
        setAccountsInitialized(true);
      } else {
        console.log("ControllerAccount is null in production or not connected.");
        setAccountsInitialized(true);
      }
    }
  }, [isDev, controllerAccount, burnerAccount]);

  const bg = `/images/covers/${getRandomBackgroundImage()}.png`;

  if (!accountsInitialized) {
    return <LoadingScreen backgroundImage={bg} />;
  }

  // Handle Loading Screen
  if (isDev) {
    if (!burnerAccount) {
      return <LoadingScreen backgroundImage={bg} />;
    }
  } else {
    if (isConnecting) {
      return <LoadingScreen backgroundImage={bg} />;
    }
    if (!isConnected && !isConnecting && !controllerAccount) {
      return (
        <div className="relative h-screen w-screen pointer-events-auto">
          <img className="absolute h-screen w-screen object-cover" src={bg} alt="Cover" />
          <div className="absolute z-10 w-screen h-screen flex justify-center flex-wrap self-center">
            <div className="self-center bg-brown rounded-lg border p-4 md:p-8 text-gold w-[90%] md:min-w-[600px] md:max-w-[800px] overflow-hidden relative z-50 shadow-2xl border-white/40 border-gradient mx-4">
              <div className="w-full text-center pt-2 md:pt-6">
                <div className="mx-auto flex mb-2 md:mb-8">
                  <img src="/images/eternum_with_snake.png" className="w-48 md:w-96 mx-auto" alt="Eternum Logo" />
                </div>
              </div>
              <div className="flex space-x-2 mt-2 md:mt-8 justify-center">
                {!isConnected && (
                  <button
                    className="px-3 md:px-4 py-2 bg-[#ffc52a] border-2 border-[#ffc52a] text-black flex font-bold rounded text-base md:text-lg fill-black uppercase leading-6 shadow-md hover:shadow-lg active:shadow-inner hover:scale-105 transition-all duration-300 hover:-translate-y-1"
                    onClick={connectWallet}
                  >
                    <CartridgeSmall className="w-5 md:w-6 mr-1 md:mr-2 fill-current self-center" /> Login
                  </button>
                )}
              </div>
              <div className="text-center text-xs md:text-sm text-white/50 mt-1 md:mt-4 px-2 md:px-0">
                Eternum uses a next generation smart contract wallet -{" "}
                <a href="https://cartridge.gg/" target="_blank" className="underline">
                  Cartridge Controller
                </a>{" "}
                <br />
                No download, no seed or passphrase - only a Passkey. <br />
                No transaction signatures needed. <br /> We recommend using a phone however you can also use{" "}
                <a href="https://www.bitwarden.com/" target="_blank" className="underline">
                  {" "}
                  bitwarden
                </a>{" "}
                <br />
                to manage your passkeys
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!controllerAccount && isConnected) {
      // Connected but controllerAccount is not set yet
      return <LoadingScreen backgroundImage="/images/cover.png" />;
    }
  }

  // Once account is set, render the children
  return (
    <DojoContext.Provider
      value={{
        ...value,
        masterAccount,
        account: {
          create,
          list,
          get,
          select,
          clear,
          account: accountToUse as Account | AccountInterface,
          isDeploying,
          accountDisplay: displayAddress((accountToUse as Account | AccountInterface)?.address || ""),
        },
      }}
    >
      {children}
    </DojoContext.Provider>
  );
};
