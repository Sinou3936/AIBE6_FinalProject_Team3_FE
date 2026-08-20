import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  // 회귀 테스트 - role="dialog" aria-modal="true"만 있고 aria-label/aria-labelledby가 없어,
  // 스크린리더가 모달을 열었을 때 목적 없이 그냥 "dialog"라고만 안내했다. 모든 호출부가 이미
  // 컨텐츠 안에 제목(h2 등)을 넣고 있으므로, Modal이 그 heading을 찾아 dialog에
  // aria-labelledby로 연결해야 한다.
  it('컨텐츠 안의 첫 heading을 찾아 dialog의 aria-labelledby로 연결한다', () => {
    render(
      <Modal open onClose={() => {}}>
        <h2>관리자로 지정할까요?</h2>
        <p>내용</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    const heading = screen.getByRole('heading', { name: '관리자로 지정할까요?' });

    expect(heading.id).toBeTruthy();
    expect(dialog.getAttribute('aria-labelledby')).toBe(heading.id);
  });

  // heading에 이미 id가 있는 호출부(드묾)라면 그 id를 그대로 재사용해야 한다 - 굳이 덮어써서
  // 다른 곳에서 그 id를 참조하고 있었을 가능성을 깨지 않는다.
  it('heading에 이미 id가 있으면 그 id를 그대로 사용한다', () => {
    render(
      <Modal open onClose={() => {}}>
        <h2 id="existing-heading-id">삭제할까요?</h2>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-labelledby')).toBe('existing-heading-id');
  });

  // heading이 아예 없는 컨텐츠는 aria-labelledby 없이 렌더링되는 게 맞는 동작이다(회귀 방지 -
  // 존재하지 않는 id를 가리키는 aria-labelledby를 만들어내면 안 된다).
  it('heading이 없는 컨텐츠는 aria-labelledby를 붙이지 않는다', () => {
    render(
      <Modal open onClose={() => {}}>
        <p>제목 없는 안내문</p>
      </Modal>,
    );

    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-labelledby');
  });
});
