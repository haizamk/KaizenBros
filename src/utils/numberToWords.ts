/**
 * Utility to convert numeric currency values (RM) into standard Malay word representation.
 * Example: 100 -> "Ringgit Malaysia Satu Ratus Sahaja"
 */

const units = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'lapan', 'sembilan'];

function convertUnderThousand(n: number): string {
  if (n <= 0) return '';
  if (n < 10) return units[n];
  if (n === 10) return 'sepuluh';
  if (n === 11) return 'sebelas';
  if (n < 20) return `${units[n % 10]} belas`;
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const remainder = n % 10;
    return `${units[tens]} puluh${remainder ? ' ' + units[remainder] : ''}`;
  }
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  const hundredText = hundreds === 1 ? 'satu ratus' : `${units[hundreds]} ratus`;
  return `${hundredText}${remainder ? ' ' + convertUnderThousand(remainder) : ''}`;
}

export function convertNumberToMalayWords(amount: number): string {
  if (isNaN(amount) || amount === 0) {
    return 'Ringgit Malaysia Sifar Sahaja';
  }

  const positiveAmount = Math.abs(amount);
  const ringgit = Math.floor(positiveAmount);
  const sen = Math.round((positiveAmount - ringgit) * 100);

  let ringgitWords = '';
  if (ringgit === 0) {
    ringgitWords = 'sifar';
  } else if (ringgit < 1000) {
    ringgitWords = convertUnderThousand(ringgit);
  } else if (ringgit < 1000000) {
    const thousands = Math.floor(ringgit / 1000);
    const remainder = ringgit % 1000;
    const thousandText = thousands === 1 ? 'satu ribu' : `${convertUnderThousand(thousands)} ribu`;
    ringgitWords = `${thousandText}${remainder ? ' ' + convertUnderThousand(remainder) : ''}`;
  } else {
    const millions = Math.floor(ringgit / 1000000);
    const remainder = ringgit % 1000000;
    const millionText = `${convertUnderThousand(millions)} juta`;
    ringgitWords = `${millionText}${remainder ? ' ' + convertUnderThousand(remainder) : ''}`;
  }

  let resultWords = `Ringgit Malaysia ${ringgitWords}`;

  if (sen > 0) {
    const senWords = convertUnderThousand(sen);
    resultWords += ` Dan Sen ${senWords}`;
  }

  resultWords += ' Sahaja';

  // Capitalize each word nicely
  return resultWords
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      if (word.toLowerCase() === 'malaysia') return 'Malaysia';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
