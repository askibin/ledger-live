import React, { PropsWithChildren } from "react";
import { PostOnboardingProvider } from "@ledgerhq/live-common/postOnboarding/PostOnboardingProvider";
import { getPostOnboardingAction, getPostOnboardingActionsForDevice } from ".";
import { useNavigateToPostOnboardingHubCallback } from "./hooks";

const PostOnboardingProviderWrapped: React.FC<PropsWithChildren<{}>> = ({
  children,
}) => {
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();
  return (
    <PostOnboardingProvider
      navigateToPostOnboardingHub={navigateToPostOnboardingHub}
      getPostOnboardingAction={getPostOnboardingAction}
      getPostOnboardingActionsForDevice={getPostOnboardingActionsForDevice}
    >
      {children}
    </PostOnboardingProvider>
  );
};

export default PostOnboardingProviderWrapped;
