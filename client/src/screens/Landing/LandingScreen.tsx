import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Chip } from '../../components/Chip';
import { Button } from '../../components/Button';

export interface LandingScreenProps {
  navigation: any;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ navigation }) => {
  const { colors, typography, spacing, isDark, toggleTheme } = useTheme();

  const handleNavigateRegister = () => {
    navigation.navigate('Register');
  };

  const handleNavigateLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Top Navigation Bar */}
      <View
        style={[
          styles.navbar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.brandRow}>
          <View
            style={[
              styles.logoBadge,
              { backgroundColor: colors.primaryContainer },
            ]}
          >
            <Text
              style={[
                styles.logoText,
                { color: colors.onPrimaryContainer },
              ]}
            >
              TU
            </Text>
          </View>
          <Text
            style={[
              styles.brandTitle,
              { color: colors.onSurface, fontSize: typography.titleMedium.fontSize },
            ]}
          >
            TeamUp
          </Text>
        </View>

        <View style={styles.navActions}>
          <TouchableOpacity
            style={[
              styles.themeToggleBtn,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.outlineVariant,
              },
            ]}
            onPress={toggleTheme}
            accessibilityLabel="Toggle theme"
          >
            <Text style={[styles.themeToggleText, { color: colors.onSurface }]}>
              {isDark ? 'Light' : 'Dark'}
            </Text>
          </TouchableOpacity>

          <Button
            title="Log In"
            variant="outline"
            onPress={handleNavigateLogin}
            style={styles.navLoginBtn}
          />
          <Button
            title="Join TeamUp"
            variant="primary"
            onPress={handleNavigateRegister}
            style={styles.navJoinBtn}
          />
        </View>
      </View>

      {/* Hero Section */}
      <View style={[styles.heroSection, { paddingVertical: spacing.xl }]}>
        <Badge
          label="Campus Project & Teammate Platform"
          variant="primary"
          style={styles.heroPill}
        />

        <Text
          style={[
            styles.heroHeadline,
            {
              color: colors.onSurface,
              fontSize: 38,
              lineHeight: 46,
            },
          ]}
        >
          Your next project starts with the right team.
        </Text>

        <Text
          style={[
            styles.heroSubtitle,
            {
              color: colors.onSurfaceVariant,
              fontSize: typography.bodyLarge.fontSize,
              lineHeight: 26,
              marginTop: spacing.md,
            },
          ]}
        >
          Connect with classmates who complement your stack, match your schedule, and actually want to build great software together.
        </Text>

        {/* Hero CTAs */}
        <View style={[styles.heroCtaRow, { marginTop: spacing.lg }]}>
          <Button
            title="Join TeamUp"
            variant="primary"
            onPress={handleNavigateRegister}
            style={styles.heroPrimaryBtn}
          />
          <Button
            title="Log In"
            variant="outline"
            onPress={handleNavigateLogin}
            style={styles.heroSecondaryBtn}
          />
        </View>

        {/* Feature Highlight Tags */}
        <View style={[styles.highlightRow, { marginTop: spacing.lg }]}>
          <Chip label="Stack Compatibility" selected variant="secondary" style={styles.highlightChip} />
          <Chip label="GitHub Activity Sync" selected variant="secondary" style={styles.highlightChip} />
          <Chip label="Conflict-Free Scheduling" selected variant="secondary" style={styles.highlightChip} />
          <Chip label="Capstone & Hackathons" selected variant="secondary" style={styles.highlightChip} />
        </View>
      </View>

      {/* Interactive Teammate Preview Section */}
      <View style={[styles.sectionContainer, { marginTop: spacing.md }]}>
        <Text
          style={[
            styles.sectionEyebrow,
            { color: colors.primary, fontSize: typography.labelMedium.fontSize },
          ]}
        >
          MATCHMAKING IN ACTION
        </Text>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.onSurface, fontSize: typography.headlineMedium.fontSize },
          ]}
        >
          See who you could be building with
        </Text>
        <Text
          style={[
            styles.sectionSubtitle,
            { color: colors.onSurfaceVariant, marginTop: spacing.xs },
          ]}
        >
          Our scoring engine weights skill overlap, experience levels, and verified GitHub contributions.
        </Text>

        {/* Mock Candidate Card */}
        <Card style={[styles.previewCard, { marginTop: spacing.md }]}>
          <View style={styles.previewHeaderRow}>
            <View style={styles.previewUserRow}>
              <View
                style={[
                  styles.previewAvatar,
                  { backgroundColor: colors.primaryContainer },
                ]}
              >
                <Text
                  style={{
                    color: colors.onPrimaryContainer,
                    fontWeight: '700',
                    fontSize: 16,
                  }}
                >
                  AJ
                </Text>
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text
                  style={[
                    styles.previewName,
                    { color: colors.onSurface, fontSize: typography.titleMedium.fontSize },
                  ]}
                >
                  Alice Johnson
                </Text>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>
                  Computer Science • Fall 2026
                </Text>
              </View>
            </View>

            <Badge label="95% Match" variant="primary" />
          </View>

          <Text
            style={[
              styles.previewBio,
              { color: colors.onSurface, marginTop: spacing.sm },
            ]}
          >
            Fullstack React Native and Node developer passionate about building clean mobile architectures and real-time collaboration tools.
          </Text>

          {/* Skill chips */}
          <View style={[styles.previewSkillRow, { marginTop: spacing.sm }]}>
            <Chip label="#React Native" selected variant="primary" style={{ marginRight: 6 }} />
            <Chip label="#TypeScript" selected variant="primary" style={{ marginRight: 6 }} />
            <Chip label="#Node.js" selected variant="secondary" style={{ marginRight: 6 }} />
          </View>

          {/* GitHub Activity Summary */}
          <View
            style={[
              styles.previewGithubRow,
              { backgroundColor: colors.surfaceVariant, marginTop: spacing.md },
            ]}
          >
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>
              @alicejohnson • 24 repositories • 350 commits this year
            </Text>
          </View>

          <View style={{ marginTop: spacing.md }}>
            <Button
              title="Invite to Team"
              variant="primary"
              onPress={handleNavigateRegister}
            />
          </View>
        </Card>
      </View>

      {/* Bento Feature Grid */}
      <View style={[styles.sectionContainer, { marginTop: spacing.xl }]}>
        <Text
          style={[
            styles.sectionEyebrow,
            { color: colors.primary, fontSize: typography.labelMedium.fontSize },
          ]}
        >
          BUILT FOR SPEED & RELIABILITY
        </Text>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.onSurface, fontSize: typography.headlineMedium.fontSize },
          ]}
        >
          Everything your project needs to succeed
        </Text>

        <View style={[styles.bentoGrid, { marginTop: spacing.md }]}>
          {/* Card 1: Skill Matching */}
          <Card style={styles.bentoCard}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primaryContainer },
              ]}
            >
              <Text
                style={[
                  styles.iconText,
                  { color: colors.onPrimaryContainer },
                ]}
              >
                SM
              </Text>
            </View>
            <Text
              style={[
                styles.bentoCardTitle,
                { color: colors.onSurface, fontSize: typography.titleMedium.fontSize },
              ]}
            >
              Skill-Based Matching
            </Text>
            <Text
              style={[
                styles.bentoCardBody,
                { color: colors.onSurfaceVariant, marginTop: spacing.xs },
              ]}
            >
              Search by specific technologies like React Native, Python, or TypeScript. Find classmates whose verified skill set matches your exact project requirements.
            </Text>
          </Card>

          {/* Card 2: Meeting Scheduler */}
          <Card style={styles.bentoCard}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.secondaryContainer },
              ]}
            >
              <Text
                style={[
                  styles.iconText,
                  { color: colors.onSecondaryContainer },
                ]}
              >
                MS
              </Text>
            </View>
            <Text
              style={[
                styles.bentoCardTitle,
                { color: colors.onSurface, fontSize: typography.titleMedium.fontSize },
              ]}
            >
              Smart Meeting Scheduler
            </Text>
            <Text
              style={[
                styles.bentoCardBody,
                { color: colors.onSurfaceVariant, marginTop: spacing.xs },
              ]}
            >
              Propose candidate meeting slots and let your team vote. Once consensus is reached, lock the winning slot into the shared project calendar instantly.
            </Text>
          </Card>

          {/* Card 3: GitHub Sync */}
          <Card style={styles.bentoCard}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.tertiaryContainer },
              ]}
            >
              <Text
                style={[
                  styles.iconText,
                  { color: colors.onTertiaryContainer },
                ]}
              >
                GH
              </Text>
            </View>
            <Text
              style={[
                styles.bentoCardTitle,
                { color: colors.onSurface, fontSize: typography.titleMedium.fontSize },
              ]}
            >
              Verified GitHub Activity
            </Text>
            <Text
              style={[
                styles.bentoCardBody,
                { color: colors.onSurfaceVariant, marginTop: spacing.xs },
              ]}
            >
              Connect your GitHub account via OAuth. Display real commit frequency, public repositories, and top languages so teammates know your coding track record.
            </Text>
          </Card>

          {/* Card 4: Idea Hub */}
          <Card style={styles.bentoCard}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.surfaceVariant },
              ]}
            >
              <Text
                style={[
                  styles.iconText,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                IH
              </Text>
            </View>
            <Text
              style={[
                styles.bentoCardTitle,
                { color: colors.onSurface, fontSize: typography.titleMedium.fontSize },
              ]}
            >
              Collaborative Idea Hub
            </Text>
            <Text
              style={[
                styles.bentoCardBody,
                { color: colors.onSurfaceVariant, marginTop: spacing.xs },
              ]}
            >
              Explore capstone ideas, upvote community submissions, and generate structured project proposals powered by AI to kickstart your next build.
            </Text>
          </Card>
        </View>
      </View>

      {/* How It Works (3 Steps) */}
      <View style={[styles.sectionContainer, { marginTop: spacing.xl }]}>
        <Text
          style={[
            styles.sectionEyebrow,
            { color: colors.primary, fontSize: typography.labelMedium.fontSize },
          ]}
        >
          SIMPLE PROCESS
        </Text>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.onSurface, fontSize: typography.headlineMedium.fontSize },
          ]}
        >
          How TeamUp works
        </Text>

        <View style={[styles.stepsContainer, { marginTop: spacing.md }]}>
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepNumberBadge,
                { backgroundColor: colors.primaryContainer },
              ]}
            >
              <Text
                style={[
                  styles.stepNumberText,
                  { color: colors.onPrimaryContainer },
                ]}
              >
                1
              </Text>
            </View>
            <Text
              style={[
                styles.stepTitle,
                { color: colors.onSurface, fontSize: typography.titleMedium.fontSize },
              ]}
            >
              Create Your Profile
            </Text>
            <Text
              style={[
                styles.stepDescription,
                { color: colors.onSurfaceVariant, marginTop: spacing.xs },
              ]}
            >
              List your department, semester, and skills. Connect your GitHub account with a single click.
            </Text>
          </View>

          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepNumberBadge,
                { backgroundColor: colors.secondaryContainer },
              ]}
            >
              <Text
                style={[
                  styles.stepNumberText,
                  { color: colors.onSecondaryContainer },
                ]}
              >
                2
              </Text>
            </View>
            <Text
              style={[
                styles.stepTitle,
                { color: colors.onSurface, fontSize: typography.titleMedium.fontSize },
              ]}
            >
              Match & Invite
            </Text>
            <Text
              style={[
                styles.stepDescription,
                { color: colors.onSurfaceVariant, marginTop: spacing.xs },
              ]}
            >
              Search by skill name, review compatibility percentages, and send invitations directly to candidates.
            </Text>
          </View>

          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepNumberBadge,
                { backgroundColor: colors.tertiaryContainer },
              ]}
            >
              <Text
                style={[
                  styles.stepNumberText,
                  { color: colors.onTertiaryContainer },
                ]}
              >
                3
              </Text>
            </View>
            <Text
              style={[
                styles.stepTitle,
                { color: colors.onSurface, fontSize: typography.titleMedium.fontSize },
              ]}
            >
              Schedule & Ship
            </Text>
            <Text
              style={[
                styles.stepDescription,
                { color: colors.onSurfaceVariant, marginTop: spacing.xs },
              ]}
            >
              Propose meeting times, track project deadlines on the team calendar, and deliver your project together.
            </Text>
          </View>
        </View>
      </View>

      {/* Student Testimonials / Social Proof */}
      <View style={[styles.sectionContainer, { marginTop: spacing.xl }]}>
        <Text
          style={[
            styles.sectionEyebrow,
            { color: colors.primary, fontSize: typography.labelMedium.fontSize },
          ]}
        >
          CAMPUS STORIES
        </Text>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.onSurface, fontSize: typography.headlineMedium.fontSize },
          ]}
        >
          What students are saying
        </Text>

        <View style={[styles.testimonialRow, { marginTop: spacing.md }]}>
          <Card style={styles.testimonialCard}>
            <Text
              style={[
                styles.testimonialQuote,
                { color: colors.onSurface, fontStyle: 'italic' },
              ]}
            >
              "TeamUp helped us assemble our capstone team in two days. The GitHub stats and skill matching made it obvious who had real experience."
            </Text>
            <Text
              style={[
                styles.testimonialAuthor,
                { color: colors.onSurface, marginTop: spacing.sm, fontWeight: '700' },
              ]}
            >
              Computer Science Senior
            </Text>
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
              Built an AI-powered IoT platform
            </Text>
          </Card>

          <Card style={styles.testimonialCard}>
            <Text
              style={[
                styles.testimonialQuote,
                { color: colors.onSurface, fontStyle: 'italic' },
              ]}
            >
              "Scheduling syncs used to take 20 messages back and forth. With TeamUp slot voting, we confirm meeting times in minutes."
            </Text>
            <Text
              style={[
                styles.testimonialAuthor,
                { color: colors.onSurface, marginTop: spacing.sm, fontWeight: '700' },
              ]}
            >
              Software Engineering Junior
            </Text>
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
              Hackathon finalist team
            </Text>
          </Card>
        </View>
      </View>

      {/* Bottom CTA Banner */}
      <Card
        style={[
          styles.bottomCtaCard,
          {
            backgroundColor: colors.surfaceVariant,
            marginTop: spacing.xl,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <Text
          style={[
            styles.bottomCtaTitle,
            { color: colors.onSurface, fontSize: typography.headlineMedium.fontSize },
          ]}
        >
          Ready to build your next project?
        </Text>
        <Text
          style={[
            styles.bottomCtaSubtitle,
            { color: colors.onSurfaceVariant, marginTop: spacing.xs },
          ]}
        >
          Create your profile in 60 seconds and connect with teammates across campus today.
        </Text>
        <View style={[styles.bottomCtaButtons, { marginTop: spacing.md }]}>
          <Button
            title="Join TeamUp"
            variant="primary"
            onPress={handleNavigateRegister}
            style={{ marginRight: 8, minWidth: 140 }}
          />
          <Button
            title="Log In"
            variant="outline"
            onPress={handleNavigateLogin}
            style={{ minWidth: 120 }}
          />
        </View>
      </Card>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.outlineVariant,
            marginTop: spacing.md,
            paddingVertical: spacing.lg,
          },
        ]}
      >
        <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>
          TeamUp &bull; University Collaboration & Project Matching Platform
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontWeight: '800',
    fontSize: 14,
  },
  brandTitle: {
    fontWeight: '700',
    marginLeft: 10,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 4,
  },
  themeToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  navLoginBtn: {
    paddingHorizontal: 12,
    height: 36,
  },
  navJoinBtn: {
    paddingHorizontal: 14,
    height: 36,
  },
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: 780,
    alignSelf: 'center',
    width: '100%',
  },
  heroPill: {
    marginBottom: 16,
  },
  heroHeadline: {
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    textAlign: 'center',
    maxWidth: 620,
  },
  heroCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroPrimaryBtn: {
    minWidth: 150,
    height: 46,
  },
  heroSecondaryBtn: {
    minWidth: 120,
    height: 46,
  },
  highlightRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  highlightChip: {
    marginBottom: 4,
  },
  sectionContainer: {
    maxWidth: 820,
    alignSelf: 'center',
    width: '100%',
  },
  sectionEyebrow: {
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontWeight: '700',
    marginTop: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  previewCard: {
    padding: 20,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewName: {
    fontWeight: '700',
  },
  previewBio: {
    fontSize: 14,
    lineHeight: 20,
  },
  previewSkillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  previewGithubRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  bentoCard: {
    flex: 1,
    minWidth: 280,
    padding: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontWeight: '700',
    fontSize: 14,
  },
  bentoCardTitle: {
    fontWeight: '700',
  },
  bentoCardBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  stepsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  stepItem: {
    flex: 1,
    minWidth: 220,
  },
  stepNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNumberText: {
    fontWeight: '700',
    fontSize: 15,
  },
  stepTitle: {
    fontWeight: '700',
  },
  stepDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  testimonialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  testimonialCard: {
    flex: 1,
    minWidth: 280,
    padding: 20,
  },
  testimonialQuote: {
    fontSize: 14,
    lineHeight: 22,
  },
  testimonialAuthor: {
    fontSize: 14,
  },
  bottomCtaCard: {
    padding: 28,
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: 820,
    alignSelf: 'center',
    width: '100%',
  },
  bottomCtaTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  bottomCtaSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 500,
  },
  bottomCtaButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    borderTopWidth: 1,
    alignItems: 'center',
    width: '100%',
  },
});
