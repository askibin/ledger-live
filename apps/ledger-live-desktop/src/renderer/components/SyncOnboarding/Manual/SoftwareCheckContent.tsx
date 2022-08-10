import React from "react";
import { Flex, Text, InfiniteLoader } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";

import Check from "~/renderer/icons/Check";
import { SoftwareCheckStatus } from "./SoftwareCheckStep";

export const BorderFlex = styled(Flex)`
  background-color: ${p => p.theme.colors.palette.neutral.c30};
  border-radius: 35px;
`;

export const IconContainer = styled(BorderFlex).attrs({
  width: 60,
  height: 60,
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
})`
  color: ${p => p.theme.colors.palette.neutral.c100};
`;

export const Row = styled(Flex).attrs({
  flexDirection: "row",
  justifyContent: "flex-start",
  alignItems: "center",
})``;

export const Column = styled(Flex).attrs({
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "stretch",
})``;

const Bullet = ({
  isActive,
  isCompleted,
  bulletText,
  text,
  subText,
}: {
  isActive: boolean;
  isCompleted: boolean;
  bulletText?: string | number;
  text: string;
  subText?: string;
}) => {
  const theme = useTheme();

  return (
    <Row mb={8}>
      <IconContainer>
        {isActive ? (
          <InfiniteLoader />
        ) : isCompleted ? (
          <Check size={24} color={theme.colors.palette.success.c50} />
        ) : (
          <Text fontSize="20px">{bulletText}</Text>
        )}
      </IconContainer>
      <Column flex="1" ml={4}>
        <Text variant="body">{text}</Text>
        {subText && (
          <Text mt={2} variant="small" color="palette.neutral.c80">
            {subText}
          </Text>
        )}
      </Column>
    </Row>
  );
};

export type Props = {
  genuineCheckStatus: SoftwareCheckStatus;
  firmwareUpdateStatus: SoftwareCheckStatus;
};

const SoftwareCheckContent = ({ genuineCheckStatus, firmwareUpdateStatus }: Props) => {
  const { t } = useTranslation();

  return (
    <>
      <Bullet
        bulletText="1"
        isActive={genuineCheckStatus === SoftwareCheckStatus.active}
        isCompleted={genuineCheckStatus === SoftwareCheckStatus.completed}
        text={
          genuineCheckStatus === SoftwareCheckStatus.completed
            ? t("syncOnboarding.manual.softwareCheckContent.genuineCheck.completed")
            : t("syncOnboarding.manual.softwareCheckContent.genuineCheck.active")
        }
      />
      <Bullet
        bulletText="2"
        isActive={firmwareUpdateStatus === SoftwareCheckStatus.active}
        isCompleted={firmwareUpdateStatus === SoftwareCheckStatus.completed}
        text={
          firmwareUpdateStatus === SoftwareCheckStatus.inactive
            ? t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.inactive")
            : firmwareUpdateStatus === SoftwareCheckStatus.active
            ? t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.active")
            : t("syncOnboarding.manual.softwareCheckContent.firmwareUpdate.completed")
        }
      />
    </>
  );
};

export default SoftwareCheckContent;
