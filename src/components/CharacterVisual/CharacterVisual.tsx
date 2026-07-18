import candidateBackground from '../../assets/candidate/rafael-detail-background-simple.png'

export function CharacterVisual() {
  return (
    <div className="character-visual" aria-hidden="true">
      <div className="character-halo" aria-hidden="true" />
      <div className="character-contours" aria-hidden="true" />
      <img src={candidateBackground} alt="" />
    </div>
  )
}