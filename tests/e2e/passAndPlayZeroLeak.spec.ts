import { test, expect } from '@playwright/test';

test.describe('Pass & Play Imposter: 390px Viewport Zero-Leak Secrecy & Mobile UX', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('runs a complete 4-player round and proves secret is NEVER in DOM while card is closed', async ({ page }) => {
    // 1. Navigate to Pass & Play
    await page.goto('/local');

    // 2. Step 1: Player Count (Verify stepper at 390px)
    await expect(page.locator('[data-testid="player-count-display"]')).toHaveText('4');
    await page.click('[data-testid="continue-count-btn"]');

    // 3. Step 2: Enter Names
    await expect(page.locator('text=Enter player names')).toBeVisible();
    const testNames = ['Aarav', 'Diya', 'Kabir', 'Rhea'];

    for (let i = 0; i < 4; i++) {
      const input = page.locator(`[data-testid="player-name-input-${i}"]`);
      await input.fill(testNames[i]);
    }

    // Continue to categories
    await page.click('[data-testid="continue-names-btn"]');

    // 4. Step 3: Choose Category & Start Game
    await expect(page.locator('text=Select categories')).toBeVisible();
    await page.click('text=Bollywood Movies');
    await page.click('[data-testid="start-game-btn"]');

    let capturedSecretWord = '';
    let capturedImposterCount = 0;

    // 5. Steps 4-5: Cycle through all 4 players
    for (let playerIdx = 0; playerIdx < 4; playerIdx++) {
      // --- Pass Screen Verification ---
      const passNameHeader = page.locator('[data-testid="active-player-name-pass"]');
      await expect(passNameHeader).toBeVisible();

      // ZERO-LEAK CHECK 1: On pass screen, secret word and imposter role MUST NOT exist in DOM
      await expect(page.locator('[data-testid="secret-word-text"]')).toHaveCount(0);
      await expect(page.locator('[data-testid="role-imposter-text"]')).toHaveCount(0);

      // Tap "I'm <Player>"
      await page.click('[data-testid="im-player-btn"]');

      // --- Folded Card Screen (Closed State) ---
      const card = page.locator('[data-testid="hold-reveal-card"]');
      await expect(card).toBeVisible();

      // ZERO-LEAK CHECK 2: Before holding, card is closed, secret MUST NOT exist in DOM
      await expect(page.locator('[data-testid="card-placeholder-text"]')).toBeVisible();
      await expect(page.locator('[data-testid="secret-word-text"]')).toHaveCount(0);
      await expect(page.locator('[data-testid="role-imposter-text"]')).toHaveCount(0);

      // Verify "Hide & pass on" is disabled before reveal
      const hidePassBtn = page.locator('[data-testid="hide-pass-btn"]');
      await expect(hidePassBtn).toBeDisabled();

      // --- Hold Down to Reveal ---
      await card.dispatchEvent('pointerdown');

      // Check revealed content while actively held down
      const isImposter = (await page.locator('[data-testid="role-imposter-text"]').count()) > 0;
      if (isImposter) {
        capturedImposterCount++;
        await expect(page.locator('[data-testid="role-imposter-text"]')).toHaveText('You are the Imposter');
      } else {
        const secretLocator = page.locator('[data-testid="secret-word-text"]');
        await expect(secretLocator).toBeVisible();
        capturedSecretWord = (await secretLocator.textContent()) || '';
        expect(capturedSecretWord.length).toBeGreaterThan(0);
      }

      // --- Release to Fold Shut ---
      await card.dispatchEvent('pointerup');

      // ZERO-LEAK CHECK 3: Upon release, secret MUST immediately disappear from DOM
      await expect(page.locator('[data-testid="card-placeholder-text"]')).toHaveText('Hidden. Hold again to re-check.');
      await expect(page.locator('[data-testid="secret-word-text"]')).toHaveCount(0);
      await expect(page.locator('[data-testid="role-imposter-text"]')).toHaveCount(0);

      // Hide & pass on button is now enabled
      await expect(hidePassBtn).toBeEnabled();
      await hidePassBtn.click();
    }

    // Exactly 1 imposter in a 4-player game
    expect(capturedImposterCount).toBe(1);
    expect(capturedSecretWord.length).toBeGreaterThan(0);

    // 6. Discussion Screen
    await expect(page.locator('text=Discussion & Clues')).toBeVisible();
    await expect(page.locator('[data-testid="starter-clue-giver"]')).toContainText('starts!');

    // ZERO-LEAK CHECK 4: Discussion screen has NO secret in DOM and NO countdown timer
    await expect(page.locator('[data-testid="secret-word-text"]')).toHaveCount(0);
    await expect(page.locator('text=/\\d{1,2}:\\d{2}/')).toHaveCount(0); // No timer

    // 7. Reveal Confirmation Sheet
    await page.click('[data-testid="reveal-imposter-btn"]');
    await expect(page.locator('text=Voting done?')).toBeVisible();
    await page.click('[data-testid="confirm-reveal-yes-btn"]');

    // 8. Result Screen
    await expect(page.locator('text=The Truth Revealed')).toBeVisible();
    await expect(page.locator('[data-testid="revealed-imposter-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="revealed-secret-word"]')).toHaveText(capturedSecretWord);
    await expect(page.locator('[data-testid="play-again-btn"]')).toBeVisible();
  });

  test('pointercancel immediately folds the card shut and hides secrets', async ({ page }) => {
    await page.goto('/local');
    await page.click('[data-testid="continue-count-btn"]');
    await page.click('[data-testid="continue-names-btn"]');
    await page.click('[data-testid="start-game-btn"]');

    // Go to first player's card
    await page.click('[data-testid="im-player-btn"]');
    const card = page.locator('[data-testid="hold-reveal-card"]');

    // Hold down
    await card.dispatchEvent('pointerdown');
    expect((await page.locator('[data-testid="secret-word-text"]').count()) + (await page.locator('[data-testid="role-imposter-text"]').count())).toBe(1);

    // Gesture interrupted (e.g. phone call, swipe, magnifier cancel)
    await card.dispatchEvent('pointercancel');

    // Must be completely closed and zero secret in DOM
    await expect(page.locator('[data-testid="secret-word-text"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="role-imposter-text"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="card-placeholder-text"]')).toHaveText('Hidden. Hold again to re-check.');
  });

  test('remembers player names in localStorage across page reloads', async ({ page }) => {
    await page.goto('/local');
    await page.click('[data-testid="continue-count-btn"]');

    // Fill unique names
    await page.locator('[data-testid="player-name-input-0"]').fill('Vikram');
    await page.locator('[data-testid="player-name-input-1"]').fill('Ananya');
    await page.locator('[data-testid="player-name-input-2"]').fill('Karan');
    await page.locator('[data-testid="player-name-input-3"]').fill('Simran');
    await page.click('[data-testid="continue-names-btn"]');

    // Reload page from fresh
    await page.goto('/local');
    await page.click('[data-testid="continue-count-btn"]');

    // Verify inputs have the remembered names!
    await expect(page.locator('[data-testid="player-name-input-0"]')).toHaveValue('Vikram');
    await expect(page.locator('[data-testid="player-name-input-1"]')).toHaveValue('Ananya');
    await expect(page.locator('[data-testid="player-name-input-2"]')).toHaveValue('Karan');
    await expect(page.locator('[data-testid="player-name-input-3"]')).toHaveValue('Simran');
  });
});
