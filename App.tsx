import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import {
  Role,
  Category,
  Request,
  Data,
  categories,
  initial,
  money,
  validateAmount,
  addGift,
} from "./src/model";
const green = "#254F3D",
  ink = "#20362C",
  muted = "#778078";
const icons: Record<Category, React.ComponentProps<typeof Feather>["name"]> = {
  Education: "book-open",
  Utilities: "zap",
  Medical: "heart",
  Essentials: "shopping-bag",
};
const colors: Record<Category, string> = {
  Education: "#EDE6D7",
  Utilities: "#E8EACD",
  Medical: "#F4DFD8",
  Essentials: "#DAE9DF",
};
function Icon({
  name,
  size = 20,
  color = green,
}: {
  name: React.ComponentProps<typeof Feather>["name"];
  size?: number;
  color?: string;
}) {
  return <Feather name={name} size={size} color={color} />;
}
function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        { opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: green }]}>{title}</Text>
    </Pressable>
  );
}
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numeric = false,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numeric?: boolean;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#91988F"
        multiline={multiline}
        keyboardType={numeric ? "decimal-pad" : "default"}
        style={[
          s.input,
          multiline && { height: 120, textAlignVertical: "top" },
        ]}
      />
    </View>
  );
}
function Progress({ request: r }: { request: Request }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={s.track}>
        <View
          style={[
            s.fill,
            { width: `${Math.min(100, (r.raised / r.goal) * 100)}%` },
          ]}
        />
      </View>
      <View style={s.between}>
        <Text style={s.small}>
          <Text style={{ fontWeight: "700", color: green }}>
            {money(r.raised)}
          </Text>{" "}
          raised
        </Text>
        <Text style={s.small}>{Math.round((r.raised / r.goal) * 100)}%</Text>
      </View>
    </View>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}
function Main() {
  const [data, setData] = useState<Data>(initial),
    [ready, setReady] = useState(false),
    [role, setRole] = useState<Role | null>(null),
    [tab, setTab] = useState("home"),
    [category, setCategory] = useState("All"),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState<string | null>(null),
    [sheet, setSheet] = useState<"create" | "gift" | null>(null),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const [title, setTitle] = useState(""),
    [story, setStory] = useState(""),
    [goal, setGoal] = useState(""),
    [location, setLocation] = useState(""),
    [kind, setKind] = useState<Category>("Essentials"),
    [attachment, setAttachment] = useState("");
  const [amount, setAmount] = useState("1000"),
    [anonymous, setAnonymous] = useState(false),
    [message, setMessage] = useState(""),
    [success, setSuccess] = useState(false);
  const saveQueue = useRef(Promise.resolve());
  const giving = useRef(false);
  useEffect(() => {
    AsyncStorage.getItem("kindred-v1")
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.requests) && Array.isArray(parsed.gifts))
            setData(parsed);
        }
      })
      .catch(() =>
        setNotice("Could not load saved demo data. Using sample requests."),
      )
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready)
      saveQueue.current = saveQueue.current
        .then(() => AsyncStorage.setItem("kindred-v1", JSON.stringify(data)))
        .catch(() =>
          setNotice(
            "Changes are visible, but could not be saved on this device.",
          ),
        );
  }, [data, ready]);
  const request = data.requests.find((r) => r.id === selected);
  const mine = data.requests.filter((r) => r.owner === "me");
  const total = data.gifts.reduce((sum, g) => sum + g.amount, 0);
  const visible = data.requests.filter(
    (r) =>
      (role === "requester" ? r.owner === "me" : r.owner !== "me") &&
      (category === "All" || r.category === category) &&
      `${r.title} ${r.name} ${r.location}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  function switchRole(next: Role) {
    setRole(next);
    setTab("home");
    setSelected(null);
    setCategory("All");
    setQuery("");
    setNotice("");
  }
  function create() {
    const n = validateAmount(goal);
    if (
      title.trim().length < 5 ||
      story.trim().length < 20 ||
      !n ||
      !location.trim()
    ) {
      setError(
        "Add a title (5+ characters), story (20+ characters), location and valid amount up to Rs. 10,000,000.",
      );
      return;
    }
    const r: Request = {
      id: Date.now().toString(),
      owner: "me",
      name: "You",
      title: title.trim(),
      story: story.trim(),
      goal: n,
      raised: 0,
      category: kind,
      location: location.trim(),
      attachment,
    };
    setData((d) => ({ ...d, requests: [r, ...d.requests] }));
    setSheet(null);
    setSelected(r.id);
    setTitle("");
    setStory("");
    setGoal("");
    setLocation("");
    setAttachment("");
    setError("");
    setNotice("Your request has been added to this device’s demo.");
  }
  function give() {
    if (giving.current || !request) return;
    const n = validateAmount(
      amount,
      Math.round((request.goal - request.raised) * 100) / 100,
    );
    if (!n) {
      setError(
        "Enter a positive amount no greater than the remaining goal, with up to 2 decimal places.",
      );
      return;
    }
    giving.current = true;
    try {
      const next = addGift(data, {
        id: Date.now().toString(),
        requestId: request.id,
        title: request.title,
        amount: n,
        anonymous,
        message: message.trim(),
        date: new Date().toISOString(),
      });
      setData(next);
      setSuccess(true);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      giving.current = false;
    }
  }
  async function attach() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled) {
        if ((result.assets[0].size ?? 0) > 10 * 1024 * 1024) {
          setError("Choose a file smaller than 10 MB.");
          return;
        }
        setAttachment(result.assets[0].name);
        setError("");
      }
    } catch {
      setError("Could not select the file. Please try again.");
    }
  }
  function openCreate() {
    setError("");
    setSheet("create");
  }
  if (!ready)
    return (
      <SafeAreaView style={[s.safe, { justifyContent: "center" }]}>
        <ActivityIndicator color={green} />
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />
      <View style={s.shell}>
        <View style={s.header}>
          <View style={s.row}>
            <View style={s.logo}>
              <Icon name="heart" color="white" size={23} />
            </View>
            <Text style={s.brand}>
              kindred<Text style={{ color: "#B89955" }}>.</Text>
            </Text>
          </View>
          <View style={s.pill}>
            <View style={s.dot} />
            <Text style={s.pillText}>DEMO</Text>
          </View>
        </View>
        {!role ? (
          <ScrollView contentContainerStyle={s.content}>
            <View style={s.welcomeArt}>
              <View style={s.bigCircle}>
                <Icon name="heart" size={80} color={green} />
              </View>
              <View style={s.artNote}>
                <Icon name="gift" />
                <Text style={s.label}>
                  A little kindness. A real difference.
                </Text>
              </View>
            </View>
            <Text style={s.eyebrow}>GOOD THINGS START WITH US</Text>
            <Text style={s.heroTitle}>Small gifts.{"\n"}Brighter days.</Text>
            <Text style={s.body}>
              A caring community for life’s everyday needs. Give a little
              support, or find a helping hand.
            </Text>
            <Text style={[s.h2, { marginTop: 22 }]}>
              How would you like to begin?
            </Text>
            {(["giver", "requester"] as Role[]).map((r) => (
              <Pressable
                key={r}
                accessibilityRole="button"
                onPress={() => switchRole(r)}
                style={s.roleCard}
              >
                <View style={s.categoryIcon}>
                  <Icon name={r === "giver" ? "gift" : "file-text"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.h3}>
                    {r === "giver" ? "I want to give" : "I need a helping hand"}
                  </Text>
                  <Text style={s.small}>
                    {r === "giver"
                      ? "Send a gift that makes a difference"
                      : "Share a bill or everyday expense"}
                  </Text>
                </View>
                <Icon name="arrow-up-right" />
              </Pressable>
            ))}
            <Text style={s.footnote}>
              Frontend demo • No real money is transferred
            </Text>
          </ScrollView>
        ) : (
          <>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.content}
            >
              {!!notice && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss notification"
                  onPress={() => setNotice("")}
                  style={s.notice}
                >
                  <Text style={s.small}>{notice} ×</Text>
                </Pressable>
              )}
              {selected && request ? (
                <>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setSelected(null)}
                    style={s.row}
                  >
                    <Icon name="arrow-left" />
                    <Text style={s.label}>Back to requests</Text>
                  </Pressable>
                  <View
                    style={[
                      s.detailArt,
                      { backgroundColor: colors[request.category] },
                    ]}
                  >
                    <Icon name={icons[request.category]} size={64} />
                    <Text style={s.eyebrow}>
                      {request.category.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={s.heroTitle}>{request.title}</Text>
                  <Text style={s.body}>
                    By {request.name} · {request.location}
                  </Text>
                  <View style={s.card}>
                    <Progress request={request} />
                    <Text style={s.body}>Goal: {money(request.goal)}</Text>
                  </View>
                  <Text style={s.h2}>Their story</Text>
                  <Text style={s.body}>{request.story}</Text>
                  {request.attachment && (
                    <View style={s.notice}>
                      <Text style={s.small}>
                        Selected bill: {request.attachment}
                        {"\n"}Filename only in this demo; not uploaded or
                        verified.
                      </Text>
                    </View>
                  )}
                  <Text style={s.footnote}>
                    Demo request · Identity and bills have not been verified.
                  </Text>
                  {role === "giver" && request.owner !== "me" && (
                    <Button
                      title={
                        request.raised >= request.goal
                          ? "Goal reached"
                          : "Send a gift"
                      }
                      disabled={request.raised >= request.goal}
                      onPress={() => {
                        setAmount(
                          String(Math.min(1000, request.goal - request.raised)),
                        );
                        setMessage("");
                        setAnonymous(false);
                        setError("");
                        setSuccess(false);
                        setSheet("gift");
                      }}
                    />
                  )}
                </>
              ) : tab === "home" ? (
                <>
                  <View style={s.between}>
                    <Text style={s.eyebrow}>
                      {role === "giver"
                        ? "A LITTLE KINDNESS GOES A LONG WAY"
                        : "YOUR NEXT CHAPTER STARTS HERE"}
                    </Text>
                    <View style={s.avatar}>
                      <Text style={s.label}>Y</Text>
                    </View>
                  </View>
                  <Text style={s.heroTitle}>
                    {role === "giver"
                      ? "Make someone’s\nday a little lighter."
                      : "A helping hand,\nwhen you need it."}
                  </Text>
                  <Text style={s.body}>
                    {role === "giver"
                      ? "Small gifts can make a big difference. Find a story that speaks to you."
                      : "Share your needs. Let kindness find you."}
                  </Text>
                  <View style={s.impact}>
                    <View style={{ flex: 1, gap: 8 }}>
                      <Text style={s.impactLabel}>
                        {role === "giver"
                          ? "YOUR KINDNESS, SO FAR"
                          : "SUPPORT FOR YOUR REQUESTS"}
                      </Text>
                      <Text style={s.impactNumber}>
                        {money(
                          role === "giver"
                            ? total
                            : mine.reduce((n, r) => n + r.raised, 0),
                        )}
                      </Text>
                      <Text style={s.impactBody}>
                        {role === "giver"
                          ? `${data.gifts.length} demo gifts · Every little bit matters`
                          : `${mine.length} requests · You’re not in this alone`}
                      </Text>
                    </View>
                    <Icon
                      name={role === "giver" ? "sun" : "heart"}
                      size={45}
                      color="#D4DBA5"
                    />
                  </View>
                  {role === "requester" && (
                    <Button
                      title="+  Add a bill or expense"
                      onPress={openCreate}
                    />
                  )}
                  <View style={s.between}>
                    <Text style={s.h2}>
                      {role === "giver" ? "Find a way to help" : "My requests"}
                    </Text>
                    <Text style={s.small}>{visible.length} requests</Text>
                  </View>
                  <View style={s.search}>
                    <Icon name="search" size={18} color={muted} />
                    <TextInput
                      accessibilityLabel="Search requests"
                      placeholder="Search stories or locations"
                      value={query}
                      onChangeText={setQuery}
                      style={{
                        flex: 1,
                        color: ink,
                        fontSize: 14,
                        paddingVertical: 12,
                      }}
                    />
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {["All", ...categories].map((c) => (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: category === c }}
                        key={c}
                        onPress={() => setCategory(c)}
                        style={[s.chip, category === c && s.chipActive]}
                      >
                        <Text
                          style={[
                            s.chipText,
                            category === c && { color: "white" },
                          ]}
                        >
                          {c}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  {visible.length === 0 && (
                    <View style={s.empty}>
                      <Icon name="inbox" size={32} />
                      <Text style={s.h3}>No requests here yet</Text>
                      <Text style={s.body}>
                        Try another search or category.
                      </Text>
                    </View>
                  )}
                  {visible.map((r) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`View ${r.title}`}
                      key={r.id}
                      onPress={() => setSelected(r.id)}
                      style={s.requestCard}
                    >
                      <View
                        style={[
                          s.cardArt,
                          { backgroundColor: colors[r.category] },
                        ]}
                      >
                        <View style={s.artBadge}>
                          <Text style={s.pillText}>{r.category}</Text>
                        </View>
                        <Icon name={icons[r.category]} size={48} />
                        <View style={s.artCaption}>
                          <Text style={s.caption}>
                            {r.category === "Education"
                              ? "A brighter tomorrow"
                              : r.category === "Utilities"
                                ? "Comfort starts at home"
                                : "Kindness in the everyday"}
                          </Text>
                        </View>
                      </View>
                      <View style={{ padding: 20, gap: 14 }}>
                        <View style={s.row}>
                          <View style={s.tinyAvatar}>
                            <Text style={s.small}>{r.name.slice(0, 1)}</Text>
                          </View>
                          <Text style={s.small}>
                            {r.name} · {r.location}
                          </Text>
                        </View>
                        <Text style={s.h3}>{r.title}</Text>
                        <Progress request={r} />
                        <View style={s.between}>
                          <Text style={s.small}>of {money(r.goal)} goal</Text>
                          <Text style={s.link}>
                            {r.raised >= r.goal
                              ? "Fully funded ✓"
                              : "View story ↗"}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </>
              ) : tab === "activity" ? (
                <>
                  <Text style={s.eyebrow}>LITTLE MOMENTS OF KINDNESS</Text>
                  <Text style={s.heroTitle}>
                    {role === "giver"
                      ? "Your giving story."
                      : "Your support story."}
                  </Text>
                  <Text style={s.body}>
                    {role === "giver"
                      ? "A record of the demo gifts you’ve shared."
                      : "Track progress across your requests."}
                  </Text>
                  {role === "giver" ? (
                    data.gifts.length ? (
                      data.gifts.map((g) => (
                        <View key={g.id} style={s.card}>
                          <View style={s.between}>
                            <Icon name="gift" />
                            <Text style={s.link}>{money(g.amount)}</Text>
                          </View>
                          <Text style={s.h3}>{g.title}</Text>
                          <Text style={s.small}>
                            {new Date(g.date).toLocaleDateString()} ·{" "}
                            {g.anonymous ? "Anonymous" : "Your name visible"} ·
                            Demo gift
                          </Text>
                          {!!g.message && (
                            <Text style={s.body}>“{g.message}”</Text>
                          )}
                        </View>
                      ))
                    ) : (
                      <View style={s.empty}>
                        <Icon name="gift" size={40} />
                        <Text style={s.h3}>Your first gift starts a story</Text>
                        <Text style={s.body}>
                          Explore requests and choose someone to support.
                        </Text>
                        <Button
                          title="Explore requests"
                          onPress={() => setTab("home")}
                        />
                      </View>
                    )
                  ) : (
                    mine.map((r) => (
                      <View key={r.id} style={s.card}>
                        <Text style={s.h3}>{r.title}</Text>
                        <Progress request={r} />
                        <Text style={s.small}>
                          {r.raised >= r.goal
                            ? "Goal reached"
                            : "Open for support"}{" "}
                          · Goal {money(r.goal)}
                        </Text>
                      </View>
                    ))
                  )}
                </>
              ) : (
                <>
                  <Text style={s.eyebrow}>YOUR CORNER OF KINDRED</Text>
                  <Text style={s.heroTitle}>Hello, kind human.</Text>
                  <View style={s.card}>
                    <View style={s.row}>
                      <View style={s.avatar}>
                        <Text style={s.h3}>Y</Text>
                      </View>
                      <View>
                        <Text style={s.h3}>You</Text>
                        <Text style={s.small}>
                          Demo account ·{" "}
                          {role === "giver" ? "Gift giver" : "Requester"}
                        </Text>
                      </View>
                    </View>
                    <Text style={s.body}>
                      Explore both sides of the community. Requests and gifts
                      are stored on this device.
                    </Text>
                    <Button
                      secondary
                      title={
                        role === "giver"
                          ? "Switch to requester"
                          : "Switch to gift giver"
                      }
                      onPress={() =>
                        switchRole(role === "giver" ? "requester" : "giver")
                      }
                    />
                  </View>
                  <View style={s.card}>
                    <Text style={s.h3}>Built around kindness</Text>
                    <Text style={s.body}>
                      Gifts are voluntary support, with no repayment expected.
                      This prototype does not connect to a bank, verify bills or
                      transfer funds.
                    </Text>
                  </View>
                  <Button
                    secondary
                    title="Back to welcome"
                    onPress={() => {
                      setRole(null);
                      setTab("home");
                    }}
                  />
                </>
              )}
              <Text style={s.footnote}>Made for a little more kindness ♡</Text>
            </ScrollView>
            <View style={s.nav}>
              {[
                {
                  id: "home",
                  icon: "grid",
                  label: role === "giver" ? "Discover" : "My requests",
                },
                { id: "activity", icon: "activity", label: "Activity" },
                { id: "profile", icon: "user", label: "Profile" },
              ].map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="tab"
                  accessibilityState={{
                    selected: tab === item.id && !selected,
                  }}
                  onPress={() => {
                    setTab(item.id);
                    setSelected(null);
                  }}
                  style={s.navItem}
                >
                  <Icon
                    name={item.icon as any}
                    color={tab === item.id ? green : "#8C968F"}
                  />
                  <Text
                    style={[
                      s.navText,
                      tab === item.id && { color: green, fontWeight: "700" },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {tab === item.id && <View style={s.navDot} />}
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>
      <Modal
        visible={!!sheet}
        animationType="slide"
        onRequestClose={() => setSheet(null)}
      >
        <SafeAreaView style={s.safe}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[
                s.content,
                { width: "100%", maxWidth: 560, alignSelf: "center" },
              ]}
            >
              <View style={s.between}>
                <Text style={s.eyebrow}>
                  {sheet === "create"
                    ? "ASKING IS A BRAVE FIRST STEP"
                    : "A SMALL ACT. A BIG FEELING."}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  onPress={() => setSheet(null)}
                  style={s.close}
                >
                  <Icon name="x" />
                </Pressable>
              </View>
              {sheet === "create" ? (
                <>
                  <Text style={s.heroTitle}>Share your need.</Text>
                  <Text style={s.body}>
                    Tell the community what a little help could mean for you.
                  </Text>
                  <Field
                    label="Request title"
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Help with this month’s electricity bill"
                  />
                  <Text style={s.label}>Category</Text>
                  <View style={s.wrap}>
                    {categories.map((c) => (
                      <Pressable
                        accessibilityRole="button"
                        key={c}
                        onPress={() => setKind(c)}
                        style={[s.chip, kind === c && s.chipActive]}
                      >
                        <Text
                          style={[s.chipText, kind === c && { color: "white" }]}
                        >
                          {c}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Field
                    label="Amount needed (LKR)"
                    value={goal}
                    onChangeText={setGoal}
                    numeric
                    placeholder="15000"
                  />
                  <Field
                    label="City or area"
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Colombo"
                  />
                  <Field
                    label="Your story"
                    value={story}
                    onChangeText={setStory}
                    multiline
                    placeholder="What do you need help with, and how will it make a difference?"
                  />
                  <Button
                    secondary
                    title={
                      attachment
                        ? `Bill selected: ${attachment}`
                        : "Attach a bill (optional)"
                    }
                    onPress={attach}
                  />
                  {!!attachment && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setAttachment("")}
                    >
                      <Text style={s.link}>Remove selected bill</Text>
                    </Pressable>
                  )}
                  <Text style={s.small}>
                    PDF or image, up to 10 MB. Only the filename is saved in
                    this frontend demo.
                  </Text>
                  {!!error && (
                    <Text accessibilityRole="alert" style={s.error}>
                      {error}
                    </Text>
                  )}
                  <Button title="Publish demo request" onPress={create} />
                </>
              ) : success ? (
                <View style={s.empty}>
                  <View style={s.bigCircle}>
                    <Icon name="check" size={60} />
                  </View>
                  <Text style={s.heroTitle}>
                    Kindness looks{"\n"}good on you.
                  </Text>
                  <Text style={s.body}>
                    Your demo gift of {money(Number(amount))} has been added to{" "}
                    {request?.name}’s request.
                  </Text>
                  <Text style={s.small}>
                    No money was charged or transferred.
                  </Text>
                  <Button
                    title="See my giving activity"
                    onPress={() => {
                      setSheet(null);
                      setSelected(null);
                      setTab("activity");
                    }}
                  />
                </View>
              ) : (
                <>
                  <Text style={s.heroTitle}>
                    Make a little{"\n"}difference.
                  </Text>
                  <Text style={s.body}>
                    Supporting {request?.name}: {request?.title}
                  </Text>
                  <View style={s.notice}>
                    <Text style={s.small}>
                      Demo only — no payment details or real charges.
                    </Text>
                  </View>
                  <Text style={s.label}>Choose your gift (LKR)</Text>
                  <View style={s.wrap}>
                    {[500, 1000, 2500, 5000].map((n) => (
                      <Pressable
                        accessibilityRole="button"
                        key={n}
                        onPress={() => setAmount(String(n))}
                        style={[s.chip, amount === String(n) && s.chipActive]}
                      >
                        <Text
                          style={[
                            s.chipText,
                            amount === String(n) && { color: "white" },
                          ]}
                        >
                          {money(n)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Field
                    label="Gift amount (LKR)"
                    value={amount}
                    onChangeText={setAmount}
                    numeric
                  />
                  <Text style={s.small}>
                    Remaining need:{" "}
                    {money(
                      request ? Math.max(0, request.goal - request.raised) : 0,
                    )}
                  </Text>
                  <Field
                    label="A kind message (optional)"
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Wishing you brighter days ahead"
                    multiline
                  />
                  <View style={s.between}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.label}>Give anonymously</Text>
                      <Text style={s.small}>
                        Hide your name from the recipient
                      </Text>
                    </View>
                    <Switch
                      accessibilityLabel="Give anonymously"
                      value={anonymous}
                      onValueChange={setAnonymous}
                      trackColor={{ true: green, false: "#DDD" }}
                    />
                  </View>
                  {!!error && (
                    <Text accessibilityRole="alert" style={s.error}>
                      {error}
                    </Text>
                  )}
                  <Button title="Confirm demo gift" onPress={give} />
                  <Text style={s.footnote}>
                    A gift, freely given. No repayment expected.
                  </Text>
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAF5" },
  shell: { flex: 1, width: "100%", maxWidth: 600, alignSelf: "center" },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 17,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#EBEDE5",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: green,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 29, fontWeight: "700", letterSpacing: -1.3, color: ink },
  pill: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    backgroundColor: "#ECF0E5",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  dot: { width: 5, height: 5, borderRadius: 5, backgroundColor: green },
  pillText: { fontSize: 10, fontWeight: "700", color: green, letterSpacing: 1 },
  content: { padding: 24, gap: 20, paddingBottom: 32 },
  eyebrow: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: green,
    flexShrink: 1,
  },
  heroTitle: {
    fontSize: 35,
    lineHeight: 41,
    fontWeight: "600",
    letterSpacing: -1.3,
    color: ink,
  },
  body: { fontSize: 15, lineHeight: 24, color: muted },
  h2: { fontSize: 21, fontWeight: "600", letterSpacing: -0.5, color: ink },
  h3: { fontSize: 18, fontWeight: "600", lineHeight: 25, color: ink },
  small: { fontSize: 12, lineHeight: 19, color: muted },
  label: { fontSize: 13, fontWeight: "600", color: ink },
  footnote: {
    fontSize: 11,
    lineHeight: 18,
    color: muted,
    textAlign: "center",
    marginTop: 8,
  },
  button: {
    minHeight: 52,
    padding: 16,
    borderRadius: 14,
    backgroundColor: green,
    justifyContent: "center",
    alignItems: "center",
  },
  secondary: {
    backgroundColor: "#EEF1E7",
    borderWidth: 1,
    borderColor: "#DCE2D6",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  welcomeArt: {
    height: 230,
    backgroundColor: "#E6EBD9",
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  bigCircle: {
    width: 140,
    height: 140,
    backgroundColor: "#D9E4C5",
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  artNote: {
    position: "absolute",
    bottom: 18,
    backgroundColor: "#FFFFFFEE",
    padding: 12,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roleCard: {
    padding: 18,
    backgroundColor: "white",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E9DF",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  categoryIcon: {
    backgroundColor: "#EEF1E7",
    width: 44,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    backgroundColor: "#E7DCC7",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  impact: {
    backgroundColor: green,
    borderRadius: 21,
    padding: 23,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  impactLabel: {
    fontSize: 9,
    letterSpacing: 1.4,
    color: "#D0DBBC",
    fontWeight: "600",
  },
  impactNumber: {
    fontSize: 32,
    color: "#F7F8E9",
    letterSpacing: -1,
    fontWeight: "600",
  },
  impactBody: { fontSize: 11, lineHeight: 17, color: "#D1DCCF" },
  search: {
    borderWidth: 1,
    borderColor: "#E1E6DC",
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "white",
  },
  chip: {
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E1E6DC",
    backgroundColor: "#FFF",
  },
  chipActive: { backgroundColor: green, borderColor: green },
  chipText: { fontSize: 12, color: green, fontWeight: "500" },
  requestCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E4E8DD",
  },
  cardArt: { height: 155, alignItems: "center", justifyContent: "center" },
  artBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: "#FFFFFFCC",
    padding: 8,
    borderRadius: 8,
  },
  artCaption: { position: "absolute", bottom: 14, right: 16 },
  caption: { fontSize: 10, color: green, fontStyle: "italic" },
  tinyAvatar: {
    height: 26,
    width: 26,
    borderRadius: 13,
    backgroundColor: "#F0EEE5",
    justifyContent: "center",
    alignItems: "center",
  },
  track: {
    height: 6,
    backgroundColor: "#ECF0E6",
    borderRadius: 5,
    overflow: "hidden",
  },
  fill: { height: 6, backgroundColor: "#779767", borderRadius: 5 },
  link: { fontSize: 12, fontWeight: "700", color: green },
  nav: {
    flexDirection: "row",
    paddingVertical: 13,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderColor: "#E7EBE1",
  },
  navItem: { flex: 1, alignItems: "center", gap: 5, minHeight: 44 },
  navText: { fontSize: 10, color: muted },
  navDot: { height: 3, width: 14, borderRadius: 3, backgroundColor: green },
  card: {
    padding: 22,
    backgroundColor: "#FFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E4E8DD",
    gap: 15,
  },
  notice: { padding: 15, backgroundColor: "#EDF1E5", borderRadius: 12 },
  empty: { paddingVertical: 30, gap: 20, alignItems: "center" },
  detailArt: {
    height: 190,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DCE2D6",
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    color: ink,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  close: { padding: 12, backgroundColor: "#ECF0E5", borderRadius: 24 },
  error: { fontSize: 13, lineHeight: 20, color: "#A13D32" },
});
