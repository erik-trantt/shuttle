import { useContext } from "react";
import { ConfigContext } from "@contexts";

export const useRuntimeConfig = () => useContext(ConfigContext);
