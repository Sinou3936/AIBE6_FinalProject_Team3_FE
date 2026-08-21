import { fireEvent, render, screen } from '@testing-library/react';
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

  // 회귀 테스트(2026-08-20) - 같은 Modal 인스턴스가 열린 채로 컨텐츠만 확인 화면 -> 결과 화면으로
  // 바뀌면(포커스를 갖고 있던 "확인" 버튼이 통째로 언마운트됨) 포커스 유실 감지 effect가 결과
  // 화면의 heading으로 포커스를 되돌려야 한다. heading은 기본적으로 포커스 불가능한 엘리먼트라
  // tabindex="-1"을 부여하지 않고 .focus()만 호출하면 조용히 무시되고 activeElement가 body에
  // 남는 버그가 있었다 - 실제로 포커스가 heading으로 옮겨가는지까지 확인한다.
  it('결과 화면으로 전환되면 확인 버튼이 언마운트돼도 포커스가 새 heading으로 이동한다', () => {
    const { rerender } = render(
      <Modal open onClose={() => {}}>
        <h2>정지 처리할까요?</h2>
        <button type="button">확인</button>
      </Modal>,
    );

    screen.getByRole('button', { name: '확인' }).focus();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '확인' }));

    rerender(
      <Modal open onClose={() => {}}>
        <h2>성공 3명, 실패 1명</h2>
      </Modal>,
    );

    const resultHeading = screen.getByRole('heading', { name: '성공 3명, 실패 1명' });
    expect(document.activeElement).toBe(resultHeading);
  });

  // 회귀 테스트(2026-08-20 전수조사) - Shift+Tab 트랩이 container.contains(active)만 확인했는데,
  // 포커스 유실 복구 effect가 tabindex="-1"을 부여한 heading이나 다이얼로그 컨테이너 자신은 그
  // 조건은 만족하면서도(container 안에 있음) focusableElements 목록에는 없다(선택자가
  // [tabindex]:not([tabindex="-1"])이므로 제외됨) - 결과화면처럼 heading이 포커스를 받은 채로
  // Shift+Tab을 누르면 트랩이 아예 반응하지 않아 포커스가 모달 밖으로 샐 수 있었다. 실제 대량처리
  // 결과화면처럼 heading과 실제 버튼이 함께 있는 상태에서, heading에 포커스가 남아있을 때
  // Shift+Tab을 누르면 트랩의 마지막 요소로 이동해야 한다.
  it('결과화면 heading에 포커스가 있을 때 Shift+Tab을 누르면 트랩 밖으로 새지 않고 마지막 요소로 이동한다', () => {
    // key를 다르게 줘서 React가 두 번째 렌더의 button을 "같은 노드의 텍스트만 바뀜"으로 재사용하지
    // 않고 실제로 언마운트/새 마운트하게 강제한다 - 실제 AdminUsersClient/AdminReportsClient의
    // 확인->결과 화면 전환(포커스를 갖고 있던 버튼이 통째로 사라짐)과 동일한 상황을 재현하기 위함.
    const { rerender } = render(
      <Modal open onClose={() => {}}>
        <h2 key="confirm-heading">정지 처리할까요?</h2>
        <button key="confirm-button" type="button">확인</button>
      </Modal>,
    );

    rerender(
      <Modal open onClose={() => {}}>
        <h2 key="result-heading">일괄 처리 결과</h2>
        <button key="result-button" type="button">닫기</button>
      </Modal>,
    );

    const resultHeading = screen.getByRole('heading', { name: '일괄 처리 결과' });
    const closeButton = screen.getByRole('button', { name: '닫기' });
    expect(document.activeElement).toBe(resultHeading); // 포커스 유실 복구 effect가 이미 옮겨둔 상태.

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(closeButton);
  });

  // 회귀 테스트(2026-08-20 전수조사) - firstFocusable보다 heading을 우선하는 게 실제로 의도된
  // 동작인지(우연히 그렇게 보이는 게 아니라) 버튼이 있는 결과화면으로 고정해서 확인한다 - 이전
  // 테스트는 버튼이 아예 없는 경우만 다뤄서, heading/firstFocusable 우선순위가 뒤바뀌어도 통과했다.
  it('결과 화면에 버튼이 있어도 heading이 firstFocusable보다 우선 포커스된다', () => {
    const { rerender } = render(
      <Modal open onClose={() => {}}>
        <h2 key="confirm-heading">정지 처리할까요?</h2>
        <button key="confirm-button" type="button">확인</button>
      </Modal>,
    );

    rerender(
      <Modal open onClose={() => {}}>
        <h2 key="result-heading">일괄 처리 결과</h2>
        <button key="result-button" type="button">닫기</button>
      </Modal>,
    );

    expect(document.activeElement).toBe(screen.getByRole('heading', { name: '일괄 처리 결과' }));
    expect(document.activeElement).not.toBe(screen.getByRole('button', { name: '닫기' }));
  });

  // 회귀 테스트(2026-08-20 전수조사) - ansim-card의 overflow-hidden만 있으면 필드가 많은 폼이
  // 뷰포트보다 길어질 때 위/아래 내용이 잘리고 스크롤할 방법이 없었다.
  it('다이얼로그에 최대 높이와 세로 스크롤이 설정된다', () => {
    render(
      <Modal open onClose={() => {}}>
        <p>내용</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('overflow-y-auto');
    expect(dialog.className).toMatch(/max-h-/);
  });
});
