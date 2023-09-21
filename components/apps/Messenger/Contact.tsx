import { useState, useEffect, useMemo, useRef } from "react";
import {
  copyKeyMenuItems,
  decryptMessage,
  shortTimeStamp,
} from "components/apps/Messenger/functions";
import { MENU_SEPERATOR, MILLISECONDS_IN_MINUTE } from "utils/constants";
import { type Event } from "nostr-tools";
import { useNostrProfile } from "components/apps/Messenger/ProfileContext";
import Button from "styles/common/Button";
import { useMenu } from "contexts/menu";
import Profile from "components/apps/Messenger/Profile";

type ContactProps = {
  lastEvent: Event;
  onClick: () => void;
  pubkey: string;
  publicKey: string;
  unreadEvent: boolean;
};

const Contact: FC<ContactProps> = ({
  lastEvent,
  onClick,
  pubkey,
  publicKey,
  unreadEvent,
}) => {
  const {
    content = "",
    created_at = 0,
    id,
    pubkey: eventPubkey,
  } = lastEvent || {};
  const [decryptedContent, setDecryptedContent] = useState("");
  const [timeStamp, setTimeStamp] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const { nip05, picture, userName } = useNostrProfile(pubkey, isVisible);
  const unreadClass = unreadEvent ? "unread" : undefined;
  const { contextMenu } = useMenu();
  const { onContextMenuCapture } = useMemo(
    () =>
      contextMenu?.(() => [
        {
          action: onClick,
          icon: "🔐",
          label: "Start end-to-end encrypted chat",
        },
        MENU_SEPERATOR,
        ...copyKeyMenuItems(pubkey),
      ]),
    [contextMenu, onClick, pubkey]
  );
  const elementRef = useRef<HTMLLIElement>(null);
  const watching = useRef(false);

  useEffect(() => {
    if (!elementRef.current || watching.current) return;

    watching.current = true;

    new IntersectionObserver(
      (entries) =>
        entries.forEach(({ isIntersecting }) => setIsVisible(isIntersecting)),
      { root: elementRef.current.parentElement, threshold: 0.4 }
    ).observe(elementRef.current);
  }, []);

  useEffect(() => {
    if (content && isVisible) {
      decryptMessage(id, content, pubkey).then(
        (message) => message && setDecryptedContent(message)
      );
    }
  }, [content, id, isVisible, pubkey]);

  useEffect(() => {
    let interval = 0;

    if (created_at) {
      setTimeStamp(shortTimeStamp(created_at));

      interval = window.setInterval(
        () => setTimeStamp(shortTimeStamp(created_at)),
        MILLISECONDS_IN_MINUTE
      );
    }

    return () => window.clearInterval(interval);
  }, [created_at, lastEvent]);

  return (
    <li
      ref={elementRef}
      className={unreadClass}
      onContextMenuCapture={onContextMenuCapture}
    >
      <Button onClick={onClick}>
        <Profile
          nip05={nip05}
          picture={picture}
          pubkey={pubkey}
          userName={userName}
        >
          <div>
            <div className={unreadClass}>
              {eventPubkey === publicKey ? "You: " : ""}
              {decryptedContent || content}
            </div>
            {timeStamp ? "·" : ""}
            <div>{timeStamp}</div>
          </div>
        </Profile>
      </Button>
    </li>
  );
};

export default Contact;
