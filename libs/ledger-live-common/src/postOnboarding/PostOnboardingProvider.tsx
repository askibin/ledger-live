import React, { PropsWithChildren } from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  PostOnboardingAction,
  PostOnboardingActionId,
} from "@ledgerhq/types-live";

export type PostOnboardingDependencies = {
  navigateToPostOnboardingHub: () => void;
  getPostOnboardingAction?: (
    id: PostOnboardingActionId
  ) => PostOnboardingAction;
  getPostOnboardingActionsForDevice: (
    id: DeviceModelId,
    mock?: boolean
  ) => PostOnboardingAction[];
};

const defaultValue: PostOnboardingDependencies = {
  navigateToPostOnboardingHub: () => {},
  getPostOnboardingAction: undefined,
  getPostOnboardingActionsForDevice: () => [],
};

export const PostOnboardingContext = React.createContext(defaultValue);

export const PostOnboardingProvider: React.FC<
  PropsWithChildren<PostOnboardingDependencies>
> = ({ children, ...props }) => {
  return (
    <PostOnboardingContext.Provider value={props}>
      {children}
    </PostOnboardingContext.Provider>
  );
};
