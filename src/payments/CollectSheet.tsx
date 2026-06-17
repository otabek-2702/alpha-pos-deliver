/* ============================================================
   CollectSheet — method chooser bottom sheet (app/payments.jsx).
   Cash · QR/Card · Split. Strings via the T translator.
   ============================================================ */
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Sheet, Text } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import type { ColorTokens } from '@/theme/tokens';
import type { Translator } from '@/i18n';
import { moneySom } from '@/lib/format';
import type { ActiveOrder } from '@/api/types';

type Method = 'cash' | 'qr' | 'split';
type Tone = 'cash' | 'qr' | 'split';

const TONE: Record<Tone, { bg: keyof ColorTokens; fg: keyof ColorTokens }> = {
  cash: { bg: 'successWeak', fg: 'successStrong' },
  qr: { bg: 'primaryWeak', fg: 'primary' },
  split: { bg: 'warningWeak', fg: 'warningStrong' },
};

export function CollectSheet({
  order,
  T,
  onClose,
  onPick,
}: {
  order: ActiveOrder;
  T: Translator;
  onClose: () => void;
  onPick: (m: Method) => void;
}) {
  const { colors, radii, space } = useTheme();
  const rows: { m: Method; icon: IconName; tone: Tone; t: string; s: string; testID: string }[] = [
    {
      m: 'cash',
      icon: 'banknote',
      tone: 'cash',
      t: T('cash'),
      s: T('cash_sub'),
      testID: 'collect-cash',
    },
    { m: 'qr', icon: 'qr', tone: 'qr', t: T('qr_card'), s: T('qr_sub'), testID: 'collect-qr' },
    {
      m: 'split',
      icon: 'layers',
      tone: 'split',
      t: T('split_payment'),
      s: T('split_sub'),
      testID: 'collect-split',
    },
  ];

  return (
    <Sheet
      testID="collect-sheet"
      title={T('collect_payment')}
      subtitle={`${T('choose_method')} · ${moneySom(order.total)}`}
      onClose={onClose}
    >
      <View style={{ gap: space[3] }}>
        {rows.map((r) => {
          const tone = TONE[r.tone];
          return (
            <Pressable
              key={r.m}
              testID={r.testID}
              onPress={() => onPick(r.m)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: space[3],
                padding: space[4],
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: pressed ? colors.surface2 : colors.surface,
              })}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: radii.md,
                  backgroundColor: colors[tone.bg],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={r.icon} size={23} color={colors[tone.fg]} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text weight="700" style={{ fontSize: 16 }}>
                  {r.t}
                </Text>
                <Text variant="sm" color="textSecondary" style={{ marginTop: 1 }}>
                  {r.s}
                </Text>
              </View>
              <Icon name="chevright" size={18} color={colors.textTertiary} />
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}
