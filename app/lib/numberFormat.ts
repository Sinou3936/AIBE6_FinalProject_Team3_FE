/**
 * 정수 입력값에 자릿수 콤마를 붙인다. 숫자가 아닌 문자는 전부 제거.
 * 보증금/월세처럼 항상 정수인 금액 입력에 사용한다.
 * 제출 시엔 각 폼의 handleSubmit이 `.replace(/,/g, '')`로 콤마를 다시 제거하고 파싱한다.
 */
export function formatIntegerInput(raw: string): string {
  const digitsOnly = raw.replace(/[^\d]/g, '');
  if (digitsOnly === '') return '';
  return Number(digitsOnly).toLocaleString('en-US');
}

/**
 * 소수점이 있는 입력값(면적 등)의 정수부에만 자릿수 콤마를 붙인다. 소수점 이하는 그대로 둔다 -
 * 입력 중간("42." 같은 상태)에 강제로 잘라버리면 타이핑이 끊겨 불편하기 때문. 두 번째 점부터는
 * 전부 무시한다(소수점은 하나만 허용).
 */
export function formatDecimalInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const firstDotIndex = cleaned.indexOf('.');

  if (firstDotIndex === -1) {
    return cleaned === '' ? '' : Number(cleaned).toLocaleString('en-US');
  }

  const integerPart = cleaned.slice(0, firstDotIndex);
  const decimalPart = cleaned.slice(firstDotIndex + 1).replace(/\./g, '');
  const formattedInteger = integerPart === '' ? '' : Number(integerPart).toLocaleString('en-US');
  return `${formattedInteger}.${decimalPart}`;
}
