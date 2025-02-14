import React, { useCallback, useEffect, useRef, useState } from "react";
import { of } from "rxjs";
import { delay } from "rxjs/operators";
import { TouchableOpacity, Linking } from "react-native";
import { useSelector } from "react-redux";
import { useTranslation, Trans } from "react-i18next";
import type {
  Account,
  TokenAccount,
  AccountLike,
  Currency,
} from "@ledgerhq/live-common/lib/types";
import {
  getMainAccount,
  getAccountCurrency,
} from "@ledgerhq/live-common/lib/account";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import type { DeviceModelId } from "@ledgerhq/devices";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import styled, { useTheme } from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";
import { useRoute } from "@react-navigation/native";
import { track, TrackScreen } from "../../analytics";
import { usePreviousRouteName } from "../../helpers/routeHooks";
import { accountScreenSelector } from "../../reducers/accounts";
import PreventNativeBack from "../../components/PreventNativeBack";
import SkipLock from "../../components/behaviour/SkipLock";
import logger from "../../logger";
import { rejectionOp } from "../../logic/debugReject";
import { ScreenName } from "../../const";
import LText from "../../components/LText";
import Button from "../../components/Button";
import Animation from "../../components/Animation";
import getDeviceAnimation from "../../components/DeviceAction/getDeviceAnimation";
import Illustration from "../../images/illustration/Illustration";
import { urls } from "../../config/urls";

const illustrations = {
  dark: require("../../images/illustration/Dark/_080.png"),
  light: require("../../images/illustration/Light/_080.png"),
};

type Props = {
  account?: TokenAccount | Account;
  parentAccount?: Account;
  navigation: any;
  route: { params: RouteParams };
  readOnlyModeEnabled: boolean;
};

type RouteParams = {
  account?: AccountLike;
  accountId: string;
  parentId?: string;
  modelId: DeviceModelId;
  wired: boolean;
  device?: Device;
  currency?: Currency;
  createTokenAccount?: boolean;
  // eslint-disable-next-line no-unused-vars
  onSuccess?: (address?: string) => void;
  onError?: () => void;
};

const AnimationContainer = styled(Flex).attrs({
  alignSelf: "stretch",
  alignItems: "center",
  justifyContent: "center",
  height: "auto",
  mt: 8,
})``;

export default function ReceiveVerifyAddress({ navigation, route }: Props) {
  const { type } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const routerRoute = useRoute();
  const lastRoute = usePreviousRouteName();

  const onModalClose = useCallback(() => {
    setError(null);
  }, []);

  const sub = useRef();

  const { onSuccess, onError, device } = route.params;

  const verifyOnDevice = useCallback(
    async (device: Device): Promise<void> => {
      if (!account) return;
      const mainAccount = getMainAccount(account, parentAccount);

      sub.current = (
        mainAccount.id.startsWith("mock")
          ? of({}).pipe(delay(1000), rejectionOp())
          : getAccountBridge(mainAccount).receive(mainAccount, {
              deviceId: device.deviceId,
              verify: true,
            })
      ).subscribe({
        complete: () => {
          if (onSuccess) onSuccess(mainAccount.freshAddress);
          else
            navigation.navigate(ScreenName.ReceiveVerificationConfirmation, {
              ...route.params,
              verified: true,
              createTokenAccount: false,
            });
        },
        error: (error: any) => {
          if (error && error.name !== "UserRefusedAddress") {
            logger.critical(error);
          }
          setError(error);
          if (onError) onError();
        },
      });
    },
    [account, navigation, onError, onSuccess, parentAccount, route.params],
  );

  const mainAccount = account && getMainAccount(account, parentAccount);
  const currency =
    route.params?.currency || (account && getAccountCurrency(account));

  const onRetry = useCallback(() => {
    track("button_clicked", {
      button: "Retry",
      screen: routerRoute.name,
    });
    onModalClose();
    if (device) {
      verifyOnDevice(device);
    }
  }, [device, onModalClose, routerRoute.name, verifyOnDevice]);

  const goBack = useCallback(() => {
    track("button_clicked", {
      button: "Cancel",
      screen: routerRoute.name,
    });
    navigation.navigate(ScreenName.ReceiveConfirmation, {
      ...route.params,
      verified: false,
    });
  }, [navigation, route.params, routerRoute.name]);

  const redirectToSupport = useCallback(() => {
    track("message_clicked", {
      message: "contact us asap",
      screen: routerRoute.name,
      url: urls.receiveVerifyAddress,
    });
    Linking.openURL(urls.receiveVerifyAddress);
  }, [routerRoute.name]);

  useEffect(() => {
    if (device) {
      verifyOnDevice(device);
    }
  }, [device, verifyOnDevice]);

  if (!account || !currency || !mainAccount || !device) return null;

  return (
    <>
      <PreventNativeBack />
      <SkipLock />
      {error ? (
        <>
          <TrackScreen
            category="Receive"
            name="Address Verification Denied"
            source={lastRoute}
          />
          <Flex flex={1} alignItems="center" justifyContent="center" p={6}>
            <Illustration
              lightSource={illustrations.light}
              darkSource={illustrations.dark}
              size={240}
            />
            <LText variant="h4" bold textAlign="center" mb={6}>
              {t("transfer.receive.verifyAddress.cancel.title")}
            </LText>
            <LText variant="body" color="neutral.c70" textAlign="center" mb={6}>
              {t("transfer.receive.verifyAddress.cancel.subtitle")}
            </LText>

            <TouchableOpacity onPress={redirectToSupport}>
              <LText variant="body" color="neutral.c70" textALign="center">
                <Trans i18nKey="transfer.receive.verifyAddress.cancel.info">
                  <LText
                    color="primary.c80"
                    style={{ textDecorationLine: "underline" }}
                  />
                </Trans>
              </LText>
            </TouchableOpacity>
          </Flex>
          <Flex
            p={6}
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Button flex={1} type="secondary" outline onPress={goBack}>
              {t("common.cancel")}
            </Button>
            <Button
              flex={1}
              type="main"
              ml={6}
              outline={false}
              onPress={onRetry}
            >
              {t("common.retry")}
            </Button>
          </Flex>
        </>
      ) : (
        <Flex flex={1} alignItems="center" justifyContent="center" p={6}>
          <TrackScreen
            category="ReceiveFunds"
            name="Verify Address"
            source={lastRoute}
          />
          <LText variant="h4" textAlign="center" mb={6}>
            {t("transfer.receive.verifyAddress.title")}
          </LText>
          <LText variant="body" color="neutral.c70" textAlign="center">
            {t("transfer.receive.verifyAddress.subtitle")}
          </LText>
          <Flex mt={10} bg={"neutral.c30"} borderRadius={8} p={6} mx={6}>
            <LText semiBold textAlign="center">
              {mainAccount.freshAddress}
            </LText>
          </Flex>
          <AnimationContainer>
            <Animation
              style={{ width: "100%" }}
              source={getDeviceAnimation({
                device,
                key: "validate",
                theme: type,
              })}
            />
          </AnimationContainer>
        </Flex>
      )}
    </>
  );
}
