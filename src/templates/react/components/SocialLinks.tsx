import { Link, Img } from '@react-email/components'
import * as React from 'react'

import { SocialLinksProps } from '../interfaces/email.interfaces'

export const SocialLinks: React.FC<SocialLinksProps> = ({
  linkedinUrl,
  linkedinIconUrl,
  instagramUrl,
  instagramIconUrl,
  githubUrl,
  githubIconUrl,
  youtubeUrl,
  youtubeIconUrl,
}) => {
  return (
    <div style={{ marginBottom: '25px', textAlign: 'center' }}>
      <Link href={linkedinUrl} style={{ textDecoration: 'none' }}>
        <Img
          src={linkedinIconUrl}
          alt="LinkedIn"
          width="24"
          height="24"
          style={{ margin: '0 12px', display: 'inline-block' }}
        />
      </Link>
      <Link href={youtubeUrl} style={{ textDecoration: 'none' }}>
        <Img
          src={youtubeIconUrl}
          alt="YouTube"
          width="24"
          height="24"
          style={{ margin: '0 12px', display: 'inline-block' }}
        />
      </Link>
      <Link href={githubUrl} style={{ textDecoration: 'none' }}>
        <Img
          src={githubIconUrl}
          alt="GitHub"
          width="24"
          height="24"
          style={{ margin: '0 12px', display: 'inline-block' }}
        />
      </Link>
      <Link href={instagramUrl} style={{ textDecoration: 'none' }}>
        <Img
          src={instagramIconUrl}
          alt="Instagram"
          width="24"
          height="24"
          style={{ margin: '0 12px', display: 'inline-block' }}
        />
      </Link>
    </div>
  )
}
