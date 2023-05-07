import { ChatMessage, scrollToBotton } from "@/components/ChatMessage";
import { ApiClient } from "@/core/ApiClient";
import { ChatContext, ChatManagement } from "@/core/ChatManagement";
import { KeyValueData } from "@/core/KeyValueData";
import { Message } from "@/Models/DataBase";
import {
  CommentOutlined,
  MessageOutlined,
  SettingOutlined,
  UnorderedListOutlined,
  UserAddOutlined,
  VerticalAlignMiddleOutlined
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Input,
  Layout,
  message,
  theme,
  Typography
} from "antd";
import React, { useContext, useState } from "react";
import style from "../styles/index.module.css";

const { Content } = Layout;
const inputRef = React.createRef<HTMLInputElement>();
let closeAllTopic: () => void = () => {};
let setInputContent: (cb: (content: string) => string) => void = () => {};

export const Chat = ({
  togglelistIsShow,
  toggleSettingShow,
  toggleRoleConfig,
}: {
  togglelistIsShow: () => void;
  toggleSettingShow: () => void;
  toggleRoleConfig: () => void;
}) => {
  const { token } = theme.useToken();
  const { chat } = useContext(ChatContext);
  const [onlyOne, setOnlyOne] = useState(false);
  const [none, setNone] = useState([]);
  function deleteChatMsg(msg: Message): void {
    chat.removeMessage(msg)?.then(() => {
      setNone([]);
    });
  }

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flex: 1,
        flexDirection: "column",
        height: "100%",
        width: "100%",
        maxHeight: "100%",
        maxWidth: "min(1200px, 100%)",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          flexWrap: "nowrap",
          gap: "16px",
          width: "100%",
          justifyContent: "flex-end",
          display: "flex",
          alignItems: "center",
          marginBottom: "3px",
          padding: "10px",
          borderRadius:
            "0" +
            " 0 " +
            token.borderRadius +
            "px " +
            token.borderRadius +
            "px",
          backgroundColor: token.colorFillContent,
        }}
      >
        <Avatar
          onClick={toggleRoleConfig}
          size={32}
          style={{ minWidth: "32px", minHeight: "32px" }}
          src={chat.group.avatar || chat?.virtualRole.avatar}
        ></Avatar>
        <Typography.Text ellipsis onClick={toggleSettingShow}>
          {chat?.group.name}
        </Typography.Text>
        <span style={{ flex: 1 }}></span>
        <UserAddOutlined onClick={() => toggleRoleConfig()} />
        <SettingOutlined
          onClick={() => toggleSettingShow()}
          style={{ marginLeft: "10px" }}
        />
        <UnorderedListOutlined
          onClick={() => {
            togglelistIsShow();
          }}
          style={{ marginLeft: "10px", marginRight: "10px" }}
        />
      </div>
      <Content
        id="content"
        style={{
          overflow: "auto",
          borderRadius: token.borderRadius,
          backgroundColor: token.colorFillContent,
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <ChatMessage
          onlyOne={onlyOne}
          onDel={(m) => {
            deleteChatMsg(m);
          }}
          rBak={(v) => {
            setInputContent(
              (m) =>
                (m ? m + "\n" : m) +
                (!m
                  ? v.ctxRole == "system"
                    ? "/::"
                    : v.virtualRoleId
                    ? "/"
                    : ""
                  : "") +
                v.text
            );
            inputRef.current?.focus();
          }}
          handerCloseAll={(cb) => (closeAllTopic = cb)}
        />
      </Content>
      <InputUtil
        onlyOne={onlyOne}
        setOnlyOne={setOnlyOne}
        reload={() => {
          setNone([]);
        }}
      ></InputUtil>
    </div>
  );
};

/**
 * 提交内容
 * @param isPush 是否对话模式
 * @returns
 */
async function sendMessage(chat: ChatManagement) {
  const messages = chat.getAskContext();
  if (messages.length == 0) return;
  let topicId = chat.config.activityTopicId;
  let msg = await chat.pushMessage({
    id: "",
    groupId: chat.group.id,
    virtualRoleId: chat.virtualRole.id,
    ctxRole: "assistant",
    text: "loading...",
    timestamp: Date.now(),
    topicId: topicId,
  });
  try {
    if (KeyValueData.instance().getApiKey()) {
      const res = await ApiClient.chatGpt({
        messages,
        model: chat.gptConfig.model,
        max_tokens: chat.gptConfig.max_tokens,
        top_p: chat.gptConfig.top_p,
        temperature: chat.gptConfig.temperature,
        n: chat.gptConfig.n,
        user: chat.getNameByRole(msg.ctxRole),
        apiKey: KeyValueData.instance().getApiKey(),
        baseUrl: chat.config.baseUrl || undefined,
      });
      msg.text = res;
      return chat.pushMessage(msg);
    }
    message.error("缺少apikey，请在设置中配置后使用");
  } catch (error: any) {
    msg.text = String(error);
    chat.pushMessage(msg);
  }
}

function InputUtil({
  onlyOne,
  setOnlyOne,
  reload,
}: {
  onlyOne: boolean;
  setOnlyOne: (onlyOne: boolean) => void;
  reload: () => void;
}) {
  const [messageInput, setmessageInput] = useState("");
  const [loading, setLoading] = useState(0);
  const { chat, activityTopic, setActivityTopic } = useContext(ChatContext);
  const { token } = theme.useToken();
  setInputContent = setmessageInput;
  /**
   * 提交内容
   * @param isNewTopic 是否开启新话题
   * @returns
   */
  async function onSubmit(isNewTopic: boolean) {
    let text = messageInput.trim();
    const isBot = text.startsWith("/");
    const isSys = text.startsWith("/::") || text.startsWith("::");
    const skipRequest = text.startsWith("\\");
    text = ChatManagement.parseText(text);
    if (!chat.config.activityTopicId) isNewTopic = true;
    if (isNewTopic) {
      await chat.newTopic(text).then((topic) => {
        setActivityTopic(topic);
      });
    }
    await chat.pushMessage({
      id: "",
      groupId: chat.group.id,
      senderId: isBot ? undefined : chat.user.id,
      virtualRoleId: isBot ? chat.virtualRole.id : undefined,
      ctxRole: isSys ? "system" : isBot ? "assistant" : "user",
      text: text,
      timestamp: Date.now(),
      topicId: chat.config.activityTopicId,
    });
    setmessageInput("");
    scrollToBotton();
    reload();
    if (isBot || skipRequest) return;
    setLoading((v) => ++v);
    await sendMessage(chat);
    setTimeout(() => {
      setLoading((v) => --v);
      scrollToBotton();
      reload();
    }, 500);
  }
  const onTextareaTab = (
    start: number,
    end: number,
    textarea: EventTarget & HTMLTextAreaElement
  ) => {
    setmessageInput((v) => v.substring(0, start) + "    " + v.substring(start));
    setTimeout(() => {
      textarea.selectionStart = start + 4;
      textarea.selectionEnd = end + 4;
    }, 0);
  };
  return (
    <>
      <div className={style.loading}>
        {loading ? (
          <div className={style.loading}>
            {[0, 1, 2, 3, 4].map((v) => (
              <div
                key={v}
                style={{ backgroundColor: token.colorPrimary }}
                className={style.loadingBar}
              ></div>
            ))}
          </div>
        ) : (
          <div className={style.loading}></div>
        )}
      </div>
      <div
        style={{
          width: "100%",
          padding: "0px 10px 10px",
          marginBottom: "15px",
          borderRadius: token.borderRadius,
          backgroundColor: token.colorFillContent,
        }}
      >
        <div
          style={{
            flexWrap: "nowrap",
            gap: "16px",
            width: "100%",
            justifyContent: "flex-end",
            display: "flex",
            alignItems: "center",
            marginBottom: "3px",
          }}
        >
          <Typography.Text
            style={{
              cursor: "pointer",
              color: onlyOne ? token.colorPrimary : undefined,
            }}
            ellipsis={true}
            onClick={() => {
              setOnlyOne(!onlyOne);
            }}
          >
            {activityTopic?.name}
          </Typography.Text>
          <span style={{ flex: 1 }}></span>
          <Button
            shape="round"
            onClick={() => {
              setOnlyOne(false);
              closeAllTopic();
            }}
          >
            <CommentOutlined />
            <VerticalAlignMiddleOutlined />
          </Button>
          <Button
            shape="circle"
            size="large"
            icon={<CommentOutlined />}
            onClick={() => onSubmit(true)}
          ></Button>
          <Button
            shape="circle"
            size="large"
            icon={<MessageOutlined />}
            onClick={() => onSubmit(false)}
          ></Button>
        </div>
        <div style={{ width: "100%" }}>
          <Input.TextArea
            placeholder="/开头代替AI发言 ::开头发出系统内容"
            autoSize={{ maxRows: 10 }}
            allowClear
            ref={inputRef}
            autoFocus={true}
            value={messageInput}
            onChange={(e) => setmessageInput(e.target.value)}
            onKeyUp={(e) =>
              (e.key === "s" && e.altKey && onSubmit(false)) ||
              (e.key === "Enter" && e.ctrlKey && onSubmit(true))
            }
            onKeyDown={(e) =>
              e.key === "Tab" &&
              (e.preventDefault(),
              onTextareaTab(
                e.currentTarget?.selectionStart,
                e.currentTarget?.selectionEnd,
                e.currentTarget
              ))
            }
          />
        </div>
      </div>
    </>
  );
}
