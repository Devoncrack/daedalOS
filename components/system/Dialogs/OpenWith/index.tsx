import type { ComponentProcessProps } from "components/system/Apps/RenderComponent";
import StyledOpenWith from "components/system/Dialogs/OpenWith/StyledOpenWith";
import StyledOpenWithList from "components/system/Dialogs/OpenWith/StyledOpenWithList";
import { getProcessByFileExtension } from "components/system/Files/FileEntry/functions";
import { useProcesses } from "contexts/process";
import directory from "contexts/process/directory";
import { useSession } from "contexts/session";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import Button from "styles/common/Button";
import Icon from "styles/common/Icon";
import { TRANSITIONS_IN_MILLISECONDS } from "utils/constants";
import { getExtension } from "utils/functions";

const EXCLUDED_PROCESSES = new Set([
  "Browser",
  "Chat",
  "ClassiCube",
  "DXBall",
  "DevTools",
  "Emulator",
  "FileExplorer",
  "IRC",
  "OpenWith",
  "Properties",
  "Quake3",
  "Run",
  "SpaceCadet",
  "StableDiffusion",
  "Terminal",
  "Transfer",
  "Webamp",
]);

type OpenWithEntryProps = {
  icon: string;
  onClick: () => void;
  selected: boolean;
  title: string;
};

const OpenWithEntry: FC<OpenWithEntryProps> = ({
  icon,
  onClick,
  selected,
  title,
}) => (
  <li className={selected ? "selected" : ""}>
    <Button onClick={onClick}>
      <figure>
        <Icon alt={title} displaySize={24} imgSize={32} src={icon} />
        <figcaption>{title}</figcaption>
      </figure>
    </Button>
  </li>
);

const OpenWith: FC<ComponentProcessProps> = ({ id }) => {
  const {
    closeWithTransition,
    open,
    processes: { [id]: process } = {},
  } = useProcesses();
  const { foregroundId, setForegroundId } = useSession();
  const { url } = process || {};
  const urlExtension = url ? getExtension(url) : "";
  const primaryExtensionProcesses = getProcessByFileExtension(urlExtension);
  const { title: primaryTitle, icon: primaryIcon } =
    (primaryExtensionProcesses && directory[primaryExtensionProcesses]) || {};
  const [selectedPid, setSelectedPid] = useState(primaryExtensionProcesses);
  const [closeOnBlur, setCloseOnBlur] = useState(false);
  const recentlySelectedPid = useRef("");
  const runApp = useCallback(
    (pid: string): void => {
      open(pid, { url });
      closeWithTransition(id);
    },
    [closeWithTransition, id, open, url]
  );
  const updateSelectedPid = useCallback(
    (pid: string) => {
      if (recentlySelectedPid.current === pid) {
        runApp(pid);
      } else {
        recentlySelectedPid.current = pid;

        setTimeout(() => {
          recentlySelectedPid.current = "";
        }, TRANSITIONS_IN_MILLISECONDS.DOUBLE_CLICK);

        setSelectedPid(pid);
      }
    },
    [runApp]
  );

  useEffect(() => {
    const isForeground = foregroundId === id;

    if (closeOnBlur) {
      if (!isForeground) closeWithTransition(id);
    } else {
      if (!isForeground) setForegroundId(id);

      setTimeout(
        () => setCloseOnBlur(true),
        TRANSITIONS_IN_MILLISECONDS.WINDOW
      );
    }
  }, [closeOnBlur, closeWithTransition, foregroundId, id, setForegroundId]);

  return (
    <StyledOpenWith>
      <h2>How do you want to open this file?</h2>
      <div>
        {primaryTitle && primaryIcon && (
          <>
            <h4>Keep using this app</h4>
            <StyledOpenWithList>
              <OpenWithEntry
                key={primaryTitle}
                icon={primaryIcon}
                onClick={() => updateSelectedPid(primaryExtensionProcesses)}
                selected={selectedPid === primaryExtensionProcesses}
                title={primaryTitle}
              />
            </StyledOpenWithList>
          </>
        )}
        <h4>Other options</h4>
        <StyledOpenWithList>
          {Object.entries(directory)
            .filter(
              ([pid]) =>
                !EXCLUDED_PROCESSES.has(pid) &&
                pid !== primaryExtensionProcesses
            )
            .map(([pid, { icon, title }]) => (
              <OpenWithEntry
                key={title}
                icon={icon}
                onClick={() => updateSelectedPid(pid)}
                selected={selectedPid === pid}
                title={title}
              />
            ))}
        </StyledOpenWithList>
      </div>
      <nav>
        <Button onClick={() => runApp(selectedPid)}>OK</Button>
      </nav>
    </StyledOpenWith>
  );
};

export default memo(OpenWith);
